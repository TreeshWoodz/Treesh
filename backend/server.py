from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import json
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Treesh API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("treesh")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def slugify(text: str) -> str:
    text = (text or "").lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-") or str(uuid.uuid4())[:8]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class Song(BaseModel):
    id: str
    title: str
    artist: str
    artistIds: List[str] = []
    genre: str = ""
    mood: str = ""
    creationDate: str = ""
    writtenBy: str = ""
    producer: str = ""
    mixer: str = ""
    featuring: str = ""
    coverArt: str = ""
    audioUrl: str = ""
    bio: str = ""
    explicit: bool = False
    treeshChoice: bool = False


class Artist(BaseModel):
    id: str
    name: str
    role: str = "Music Artist"
    bio: str = ""
    image: str = ""
    background: str = ""
    bgPos: str = "center center"
    cashapp: str = ""


class ProfileIn(BaseModel):
    profileId: str
    nickname: Optional[str] = ""
    birthday: Optional[str] = ""
    zodiac: Optional[str] = ""
    avatar: Optional[str] = ""
    accent: Optional[str] = "#9328ff"
    backdrop: Optional[str] = "aurora"


class FavoriteIn(BaseModel):
    profileId: str
    songId: str


class PlaylistCreate(BaseModel):
    profileId: str
    name: str
    songIds: List[str] = []


class PlaylistUpdate(BaseModel):
    name: Optional[str] = None
    addSongId: Optional[str] = None
    removeSongId: Optional[str] = None


# ---------------------------------------------------------------------------
# Seeding
# ---------------------------------------------------------------------------
async def seed_database():
    seed_path = ROOT_DIR / "seed_data.json"
    if not seed_path.exists():
        logger.warning("seed_data.json not found; skipping seed")
        return

    with open(seed_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    seed_version = data.get("seedVersion", 1)
    meta = await db.meta.find_one({"_id": "seed"})
    current_version = meta.get("version") if meta else 0
    force = seed_version != current_version

    # Artists
    if force or await db.artists.count_documents({}) == 0:
        await db.artists.delete_many({})
        artists = []
        for a in data.get("artists", []):
            artists.append({
                "id": a.get("artistId") or slugify(a.get("name", "")),
                "name": a.get("name", ""),
                "role": a.get("role", "Music Artist"),
                "bio": a.get("bio", ""),
                "image": a.get("image", ""),
                "background": a.get("background", ""),
                "bgPos": a.get("bgPos", "center center"),
                "cashapp": a.get("cashapp", ""),
            })
        if artists:
            await db.artists.insert_many(artists)
            logger.info(f"Seeded {len(artists)} artists")

    # Songs
    if force or await db.songs.count_documents({}) == 0:
        await db.songs.delete_many({})
        songs = []
        seen = set()
        for idx, s in enumerate(data.get("songs", [])):
            base = slugify(f"{s.get('artist','')}-{s.get('title','')}")
            sid = base
            n = 2
            while sid in seen:
                sid = f"{base}-{n}"
                n += 1
            seen.add(sid)
            songs.append({
                "id": sid,
                "order": idx,
                "title": s.get("title", ""),
                "artist": s.get("artist", ""),
                "artistIds": s.get("artistIds", []),
                "genre": s.get("genre", ""),
                "mood": s.get("mood", ""),
                "creationDate": s.get("creationDate", ""),
                "writtenBy": s.get("writtenBy", ""),
                "producer": s.get("producer", ""),
                "mixer": s.get("mixer", ""),
                "featuring": s.get("featuring", ""),
                "coverArt": s.get("coverArt", ""),
                "audioUrl": s.get("audioUrl", ""),
                "bio": s.get("bio", ""),
                "explicit": bool(s.get("explicit", False)),
                "treeshChoice": bool(s.get("treeshChoice", False)),
                "lyrics": s.get("lyrics", []),
            })
        if songs:
            await db.songs.insert_many(songs)
            logger.info(f"Seeded {len(songs)} songs")

    if force:
        await db.meta.update_one({"_id": "seed"}, {"$set": {"version": seed_version}}, upsert=True)


@app.on_event("startup")
async def on_startup():
    try:
        await seed_database()
        await db.favorites.create_index([("profileId", 1), ("songId", 1)], unique=True)
        await db.playlists.create_index([("profileId", 1)])
    except Exception as e:
        logger.error(f"Startup error: {e}")


# ---------------------------------------------------------------------------
# Catalog endpoints
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"message": "Treesh API online"}


@api_router.get("/catalog/songs", response_model=List[Song])
async def get_songs(genre: Optional[str] = None, q: Optional[str] = None,
                    artistId: Optional[str] = None, treeshChoice: Optional[bool] = None):
    query = {}
    if genre and genre.lower() != "all":
        query["genre"] = genre.lower()
    if artistId:
        query["artistIds"] = artistId
    if treeshChoice:
        query["treeshChoice"] = True
    if q:
        rx = {"$regex": re.escape(q), "$options": "i"}
        query["$or"] = [{"title": rx}, {"artist": rx}, {"writtenBy": rx}]
    songs = await db.songs.find(query, {"_id": 0, "lyrics": 0}).sort("order", 1).to_list(1000)
    return songs


@api_router.get("/catalog/lyrics/{song_id}")
async def get_lyrics(song_id: str):
    song = await db.songs.find_one({"id": song_id}, {"_id": 0, "lyrics": 1, "title": 1, "artist": 1})
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    lyrics = song.get("lyrics", [])
    return {"songId": song_id, "title": song.get("title"), "artist": song.get("artist"),
            "lyrics": lyrics, "synced": bool(lyrics)}


@api_router.get("/catalog/songs/{song_id}", response_model=Song)
async def get_song(song_id: str):
    song = await db.songs.find_one({"id": song_id}, {"_id": 0})
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    return song


@api_router.get("/catalog/genres")
async def get_genres():
    genres = await db.songs.distinct("genre")
    genres = sorted([g for g in genres if g])
    return {"genres": genres}


@api_router.get("/catalog/artists", response_model=List[Artist])
async def get_artists():
    artists = await db.artists.find({}, {"_id": 0}).to_list(1000)
    # sort by name
    artists.sort(key=lambda a: a.get("name", "").lower())
    return artists


@api_router.get("/catalog/artists/{artist_id}")
async def get_artist(artist_id: str):
    artist = await db.artists.find_one({"id": artist_id}, {"_id": 0})
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    songs = await db.songs.find({"artistIds": artist_id}, {"_id": 0}).sort("order", 1).to_list(1000)
    return {"artist": artist, "songs": songs}


# ---------------------------------------------------------------------------
# Profile endpoints (local device profile, keyed by profileId)
# ---------------------------------------------------------------------------
@api_router.post("/profile", response_model=ProfileIn)
async def upsert_profile(profile: ProfileIn):
    doc = profile.model_dump()
    doc["updatedAt"] = now_iso()
    await db.profiles.update_one({"profileId": profile.profileId}, {"$set": doc}, upsert=True)
    return profile


@api_router.get("/profile/{profile_id}")
async def get_profile(profile_id: str):
    profile = await db.profiles.find_one({"profileId": profile_id}, {"_id": 0})
    if not profile:
        return {"profileId": profile_id, "nickname": "", "birthday": "", "zodiac": "",
                "avatar": "", "accent": "#9328ff", "backdrop": "aurora", "isNew": True}
    profile["isNew"] = False
    return profile


# ---------------------------------------------------------------------------
# Favorites
# ---------------------------------------------------------------------------
@api_router.get("/favorites/{profile_id}")
async def get_favorites(profile_id: str):
    favs = await db.favorites.find({"profileId": profile_id}, {"_id": 0}).to_list(1000)
    song_ids = [f["songId"] for f in favs]
    songs = await db.songs.find({"id": {"$in": song_ids}}, {"_id": 0}).to_list(1000)
    # preserve favorite order (most recent first)
    order = {sid: i for i, sid in enumerate(reversed(song_ids))}
    songs.sort(key=lambda s: order.get(s["id"], 0))
    return {"songIds": song_ids, "songs": songs}


@api_router.post("/favorites/toggle")
async def toggle_favorite(fav: FavoriteIn):
    existing = await db.favorites.find_one({"profileId": fav.profileId, "songId": fav.songId})
    if existing:
        await db.favorites.delete_one({"profileId": fav.profileId, "songId": fav.songId})
        return {"favorited": False}
    await db.favorites.insert_one({"profileId": fav.profileId, "songId": fav.songId, "createdAt": now_iso()})
    return {"favorited": True}


# ---------------------------------------------------------------------------
# Playlists
# ---------------------------------------------------------------------------
def playlist_public(pl: dict) -> dict:
    return {k: v for k, v in pl.items() if k != "_id"}


@api_router.get("/playlists/{profile_id}")
async def get_playlists(profile_id: str):
    playlists = await db.playlists.find({"profileId": profile_id}, {"_id": 0}).sort("createdAt", -1).to_list(1000)
    return {"playlists": playlists}


@api_router.get("/playlists/detail/{playlist_id}")
async def get_playlist_detail(playlist_id: str):
    pl = await db.playlists.find_one({"id": playlist_id}, {"_id": 0})
    if not pl:
        raise HTTPException(status_code=404, detail="Playlist not found")
    songs = await db.songs.find({"id": {"$in": pl.get("songIds", [])}}, {"_id": 0}).to_list(1000)
    order = {sid: i for i, sid in enumerate(pl.get("songIds", []))}
    songs.sort(key=lambda s: order.get(s["id"], 0))
    pl["songs"] = songs
    return pl


@api_router.post("/playlists")
async def create_playlist(data: PlaylistCreate):
    pl = {
        "id": str(uuid.uuid4()),
        "profileId": data.profileId,
        "name": data.name,
        "songIds": data.songIds,
        "createdAt": now_iso(),
    }
    await db.playlists.insert_one(pl)
    return playlist_public(pl)


@api_router.patch("/playlists/{playlist_id}")
async def update_playlist(playlist_id: str, upd: PlaylistUpdate):
    pl = await db.playlists.find_one({"id": playlist_id})
    if not pl:
        raise HTTPException(status_code=404, detail="Playlist not found")
    song_ids = pl.get("songIds", [])
    set_ops = {}
    if upd.name is not None:
        set_ops["name"] = upd.name
    if upd.addSongId and upd.addSongId not in song_ids:
        song_ids.append(upd.addSongId)
    if upd.removeSongId and upd.removeSongId in song_ids:
        song_ids = [s for s in song_ids if s != upd.removeSongId]
    set_ops["songIds"] = song_ids
    await db.playlists.update_one({"id": playlist_id}, {"$set": set_ops})
    pl = await db.playlists.find_one({"id": playlist_id}, {"_id": 0})
    return pl


@api_router.delete("/playlists/{playlist_id}")
async def delete_playlist(playlist_id: str):
    res = await db.playlists.delete_one({"id": playlist_id})
    return {"deleted": res.deleted_count > 0}


# ---------------------------------------------------------------------------
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
