from fastapi import FastAPI, APIRouter, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, BeforeValidator
from typing import Annotated, List, Literal, Optional
from datetime import datetime, timezone
from pathlib import Path
import os
import logging

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Sonoko API - Treesh Games")
api_router = APIRouter(prefix="/api")

PyObjectId = Annotated[str, BeforeValidator(str)]
Mode = Literal["sonoko", "daily", "sudoku", "uno", "versus"]


class BaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    @classmethod
    def from_mongo(cls, doc):
        return cls.model_validate(doc)

    def to_mongo(self):
        data = self.model_dump(by_alias=True, exclude={"id"})
        return data


class Score(BaseDocument):
    name: str
    mode: Mode
    score: int
    date: Optional[str] = None
    created_at: str


class ScoreIn(BaseModel):
    name: str = Field(min_length=1, max_length=20)
    mode: Mode
    score: int = Field(ge=0, le=10_000_000)
    date: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")


def _filter(mode: str, date: Optional[str]):
    q = {"mode": mode}
    if mode == "daily":
        q["date"] = date
    return q


@api_router.get("/")
async def root():
    return {"message": "Sonoko by Treesh Games"}


@api_router.post("/scores")
async def submit_score(payload: ScoreIn):
    doc = Score(
        name=payload.name.strip()[:20] or "Player",
        mode=payload.mode,
        score=payload.score,
        date=payload.date if payload.mode == "daily" else None,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    res = await db.scores.insert_one(doc.to_mongo())
    q = _filter(doc.mode, doc.date)
    q["score"] = {"$gt": doc.score}
    rank = await db.scores.count_documents(q) + 1
    return {"id": str(res.inserted_id), "rank": rank}


@api_router.get("/leaderboard", response_model=List[Score], response_model_by_alias=False)
async def leaderboard(mode: Mode, date: Optional[str] = None, limit: int = Query(50, le=100)):
    cursor = db.scores.find(_filter(mode, date)).sort([("score", -1), ("created_at", 1)]).limit(limit)
    return [Score.from_mongo(d) for d in await cursor.to_list(limit)]


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


@app.on_event("startup")
async def startup():
    await db.scores.create_index([("mode", 1), ("date", 1), ("score", -1)])


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
