from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import secrets
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, BeforeValidator
from typing import Annotated, Optional, List
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Bronze Blitz API")
api_router = APIRouter(prefix="/api")

MODES = {"classic", "timed", "moves", "daily", "zen"}

PyObjectId = Annotated[str, BeforeValidator(str)]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


class BaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    @classmethod
    def from_mongo(cls, doc):
        return cls.model_validate(doc) if doc else None

    def to_mongo(self) -> dict:
        data = self.model_dump(by_alias=True)
        if data.get("_id") is None:
            data.pop("_id", None)
        return data


class Score(BaseDocument):
    player_id: str
    name: str
    mode: str
    score: int
    date: str
    created_at: str


class CloudSave(BaseDocument):
    player_id: str
    name: str
    name_lower: str
    save_code: str
    progress: dict
    updated_at: str


class ScoreIn(BaseModel):
    player_id: str = Field(min_length=4, max_length=64)
    name: str = Field(min_length=2, max_length=20)
    mode: str
    score: int = Field(ge=0, le=5_000_000)


class CloudSaveIn(BaseModel):
    player_id: str = Field(min_length=4, max_length=64)
    name: str = Field(min_length=2, max_length=20)
    save_code: Optional[str] = None
    progress: dict


class CloudLoadIn(BaseModel):
    name: str = Field(min_length=2, max_length=20)
    save_code: str = Field(min_length=4, max_length=12)


class LeaderRow(BaseModel):
    rank: int
    player_id: str
    name: str
    score: int


@api_router.get("/")
async def root():
    return {"message": "Bronze Blitz API by Treesh Games"}


@api_router.post("/scores")
async def submit_score(body: ScoreIn):
    if body.mode not in MODES:
        raise HTTPException(400, "Unknown mode")
    doc = Score(player_id=body.player_id, name=body.name.strip(), mode=body.mode,
                score=body.score, date=today(), created_at=now_iso())
    await db.scores.insert_one(doc.to_mongo())
    return {"ok": True}


@api_router.get("/leaderboard/{mode}", response_model=List[LeaderRow])
async def leaderboard(mode: str, limit: int = 25):
    if mode not in MODES:
        raise HTTPException(400, "Unknown mode")
    match = {"mode": mode}
    if mode == "daily":
        match["date"] = today()
    pipeline = [
        {"$match": match},
        {"$sort": {"score": -1, "created_at": 1}},
        {"$group": {"_id": "$player_id", "name": {"$first": "$name"}, "score": {"$first": "$score"}}},
        {"$sort": {"score": -1}},
        {"$limit": min(max(limit, 1), 100)},
    ]
    rows = await db.scores.aggregate(pipeline).to_list(100)
    return [LeaderRow(rank=i + 1, player_id=r["_id"], name=r["name"], score=r["score"]) for i, r in enumerate(rows)]


@api_router.post("/cloud/save")
async def cloud_save(body: CloudSaveIn):
    name = body.name.strip()
    by_name = CloudSave.from_mongo(await db.cloud_saves.find_one({"name_lower": name.lower()}))
    if by_name and by_name.player_id != body.player_id:
        raise HTTPException(409, "That player tag is already claimed")
    existing = CloudSave.from_mongo(await db.cloud_saves.find_one({"player_id": body.player_id}))
    if existing:
        if existing.save_code != body.save_code:
            raise HTTPException(403, "Save code does not match")
        await db.cloud_saves.update_one(
            {"player_id": body.player_id},
            {"$set": {"name": name, "name_lower": name.lower(), "progress": body.progress, "updated_at": now_iso()}},
        )
        return {"save_code": existing.save_code, "name": name, "updated_at": now_iso()}
    code = secrets.token_hex(3).upper()
    doc = CloudSave(player_id=body.player_id, name=name, name_lower=name.lower(), save_code=code,
                    progress=body.progress, updated_at=now_iso())
    await db.cloud_saves.insert_one(doc.to_mongo())
    return {"save_code": code, "name": name, "updated_at": doc.updated_at}


@api_router.post("/cloud/load")
async def cloud_load(body: CloudLoadIn):
    rec = CloudSave.from_mongo(await db.cloud_saves.find_one({"name_lower": body.name.strip().lower()}))
    if not rec or rec.save_code != body.save_code.strip().upper():
        raise HTTPException(404, "No save found for that tag and code")
    return {"player_id": rec.player_id, "name": rec.name, "save_code": rec.save_code, "progress": rec.progress}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def ensure_indexes():
    await db.scores.create_index([("mode", 1), ("date", 1), ("score", -1)])
    await db.cloud_saves.create_index("name_lower", unique=True)
    await db.cloud_saves.create_index("player_id", unique=True)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
