from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict
from typing import List, Optional, Annotated
from datetime import datetime, timezone
from pathlib import Path
from bson import ObjectId
import os
import re
import json
import uuid
import random
import logging

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

MODES = {"say_less", "finish_phrase", "real_or_cap", "flip_it", "speed_run", "daily_cookout", "ai_remix"}
CLAUDE_MODEL = "claude-sonnet-5-5"

PyObjectId = Annotated[str, BeforeValidator(lambda v: str(v) if isinstance(v, ObjectId) else v)]


class BaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    def to_mongo(self) -> dict:
        return self.model_dump(by_alias=True, exclude={"id"})

    @classmethod
    def from_mongo(cls, doc: dict):
        return cls.model_validate(doc)


class LeaderboardEntry(BaseDocument):
    player_id: str
    username: str
    mode: str
    score: int
    updated_at: str


class ScoreSubmit(BaseModel):
    player_id: str = Field(min_length=6, max_length=64)
    username: str = Field(min_length=2, max_length=20)
    mode: str
    score: int = Field(ge=0, le=100000)


class JudgeRequest(BaseModel):
    prompt: str = Field(max_length=300)
    direction: str
    answer: str = Field(min_length=1, max_length=300)


class QuestionRequest(BaseModel):
    count: int = Field(default=8, ge=1, le=12)
    avoid: List[str] = []


AAVE_SYSTEM = (
    "You are a warm, culturally fluent expert in African American Vernacular English (AAVE) and Black culture. "
    "You treat AAVE as a legitimate, rule-governed language variety (habitual be, stressed BEEN, completive done, "
    "copula deletion, multiple negation, etc.). Be celebratory, accurate and respectful. Never use slurs, never "
    "stereotype or mock. Always reply with valid JSON only, no markdown."
)


async def ask_claude(prompt: str) -> str:
    chat = LlmChat(
        api_key=os.environ["EMERGENT_LLM_KEY"],
        session_id=str(uuid.uuid4()),
        system_message=AAVE_SYSTEM,
    ).with_model("anthropic", CLAUDE_MODEL)
    out = ""
    async for ev in chat.stream_message(UserMessage(text=prompt)):
        if isinstance(ev, TextDelta):
            out += ev.content
        elif isinstance(ev, StreamDone):
            break
    return out


def parse_json(text: str):
    m = re.search(r"[\[{].*[\]}]", text, re.S)
    if not m:
        raise ValueError("no json")
    return json.loads(m.group(0))


@api_router.get("/")
async def root():
    return {"message": "Ebonics by Treesh Games API"}


@api_router.post("/flip/judge")
async def judge_flip(req: JudgeRequest):
    target = "AAVE" if req.direction == "to_aave" else "Standard English"
    prompt = (
        f"Game 'Flip It'. The player must flip this sentence into {target}.\n"
        f"Original: \"{req.prompt}\"\nPlayer answer: \"{req.answer}\"\n"
        "Score 0-100 on meaning preserved, grammatical authenticity and natural flow. "
        "Reward correct AAVE grammar features. Off-topic or empty-effort answers score under 20. "
        "Return JSON: {\"score\": int, \"verdict\": short hype verdict (max 4 words), "
        "\"feedback\": one or two friendly sentences explaining, \"example\": one strong model answer}"
    )
    try:
        data = parse_json(await ask_claude(prompt))
        score = max(0, min(100, int(data.get("score", 0))))
        return {
            "score": score,
            "verdict": str(data.get("verdict", ""))[:40],
            "feedback": str(data.get("feedback", ""))[:400],
            "example": str(data.get("example", ""))[:200],
            "source": "ai",
        }
    except Exception as e:
        logger.error(f"judge failed: {e}")
        raise HTTPException(status_code=503, detail="AI judge unavailable")


@api_router.post("/ai/questions")
async def ai_questions(req: QuestionRequest):
    avoid = ", ".join(req.avoid[-40:])
    prompt = (
        f"Create {req.count} fresh, fun multiple-choice questions about AAVE words, phrases, grammar features "
        "and Black cultural expressions (regional variety welcome: South, NYC, Bay, Philly, DMV, New Orleans, Chicago). "
        f"Avoid these already-used terms: {avoid or 'none'}. Mix: meaning-of-phrase, which-sentence-uses-grammar-correctly, "
        "and origin/culture facts that are well documented. Return JSON array of objects: "
        "{\"term\": str, \"question\": str, \"options\": [4 short strings], \"answer_index\": 0-3, \"explanation\": one sentence}"
    )
    try:
        data = parse_json(await ask_claude(prompt))
        out = []
        for q in data:
            opts = q.get("options", [])
            ai = q.get("answer_index")
            if len(opts) != 4 or not isinstance(ai, int) or not 0 <= ai < 4:
                continue
            correct = opts[ai]
            random.shuffle(opts)
            out.append({
                "term": str(q.get("term", "")),
                "prompt": str(q.get("question", "")),
                "options": [str(o) for o in opts],
                "answer": opts.index(correct),
                "explanation": str(q.get("explanation", "")),
            })
        if not out:
            raise ValueError("empty")
        return {"questions": out}
    except Exception as e:
        logger.error(f"ai questions failed: {e}")
        raise HTTPException(status_code=503, detail="AI remix unavailable")


@api_router.post("/leaderboard")
async def submit_score(req: ScoreSubmit):
    if req.mode not in MODES:
        raise HTTPException(status_code=400, detail="Unknown mode")
    await db.leaderboard.update_one(
        {"player_id": req.player_id, "mode": req.mode},
        {"$max": {"score": req.score},
         "$set": {"username": req.username.strip(), "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    doc = await db.leaderboard.find_one({"player_id": req.player_id, "mode": req.mode})
    return LeaderboardEntry.from_mongo(doc).model_dump()


@api_router.get("/leaderboard")
async def get_leaderboard(mode: str = "say_less", limit: int = 25):
    if mode not in MODES:
        raise HTTPException(status_code=400, detail="Unknown mode")
    docs = await db.leaderboard.find({"mode": mode}).sort("score", -1).limit(min(limit, 100)).to_list(100)
    return [LeaderboardEntry.from_mongo(d).model_dump() for d in docs]


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
