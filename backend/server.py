from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import time
import math
import asyncio
import logging
from pathlib import Path
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Hoop by Treesh API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("hoop")

UA = {"User-Agent": "HoopByTreesh/1.0 (https://treesh.app/hoop)", "Accept-Language": "en"}
NOMINATIM = "https://nominatim.openstreetmap.org"
OVERPASS_MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
]

_cache: dict = {}
_nominatim_lock = asyncio.Lock()
_last_nominatim = [0.0]


def cache_get(key, ttl):
    v = _cache.get(key)
    if v and time.time() - v[0] < ttl:
        return v[1]
    return None


def cache_set(key, val):
    if len(_cache) > 2000:
        _cache.clear()
    _cache[key] = (time.time(), val)


def haversine(lat1, lon1, lat2, lon2):
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


async def nominatim(path: str, params: dict):
    """Nominatim usage policy: max 1 req/sec, identify with UA. We serialize + cache."""
    key = f"nom:{path}:{sorted(params.items())}"
    hit = cache_get(key, 60 * 60 * 24)
    if hit is not None:
        return hit
    async with _nominatim_lock:
        wait = 1.05 - (time.time() - _last_nominatim[0])
        if wait > 0:
            await asyncio.sleep(wait)
        try:
            async with httpx.AsyncClient(timeout=15, headers=UA) as c:
                r = await c.get(f"{NOMINATIM}/{path}", params={**params, "format": "jsonv2"})
            _last_nominatim[0] = time.time()
            if r.status_code == 429:
                raise HTTPException(429, "Address lookup is busy. Try again in a few seconds.")
            r.raise_for_status()
            data = r.json()
        except HTTPException:
            raise
        except Exception as e:
            logger.warning("nominatim error %s", e)
            raise HTTPException(502, "Address lookup is unavailable right now.")
    cache_set(key, data)
    return data


def short_label(item):
    a = item.get("address") or {}
    parts = [
        a.get("road") or a.get("neighbourhood") or a.get("suburb"),
        a.get("city") or a.get("town") or a.get("village") or a.get("county"),
        a.get("state") or a.get("country"),
    ]
    parts = [p for p in parts if p]
    return ", ".join(parts) if parts else item.get("display_name", "")


@api_router.get("/")
async def root():
    return {"app": "Hoop by Treesh", "status": "ok"}


@api_router.get("/geocode")
async def geocode(q: str = Query(..., min_length=2, max_length=200), limit: int = 5):
    data = await nominatim("search", {"q": q, "limit": max(1, min(limit, 8)), "addressdetails": 1})
    return {
        "results": [
            {
                "lat": float(d["lat"]),
                "lon": float(d["lon"]),
                "name": d.get("name") or short_label(d),
                "label": d.get("display_name", ""),
                "short": short_label(d),
            }
            for d in data
        ]
    }


@api_router.get("/reverse")
async def reverse(lat: float, lon: float):
    data = await nominatim("reverse", {"lat": round(lat, 5), "lon": round(lon, 5), "zoom": 16, "addressdetails": 1})
    if not data or "error" in data:
        return {"label": f"{lat:.4f}, {lon:.4f}", "short": f"{lat:.4f}, {lon:.4f}"}
    return {"label": data.get("display_name", ""), "short": short_label(data)}


def normalize_court(e, lat, lon):
    la = e.get("lat") or (e.get("center") or {}).get("lat")
    lo = e.get("lon") or (e.get("center") or {}).get("lon")
    if la is None or lo is None:
        return None
    t = e.get("tags", {}) or {}
    leisure = t.get("leisure", "")
    indoor = t.get("indoor") in ("yes", "room") or t.get("covered") == "yes" or leisure in ("sports_centre", "sports_hall") or t.get("building") not in (None, "no")
    street = " ".join([x for x in [t.get("addr:housenumber"), t.get("addr:street")] if x])
    city = t.get("addr:city", "")
    kind = "Court"
    if leisure in ("sports_centre", "sports_hall") or t.get("building"):
        kind = "Gym"
    elif leisure == "school" or t.get("amenity") == "school":
        kind = "School"
    return {
        "id": f"{e['type']}/{e['id']}",
        "name": t.get("name") or t.get("description") or ("Indoor basketball" if indoor else "Basketball court"),
        "lat": la,
        "lon": lo,
        "distance_m": round(haversine(lat, lon, la, lo)),
        "kind": kind,
        "indoor": bool(indoor),
        "lit": t.get("lit") == "yes",
        "surface": t.get("surface"),
        "hoops": t.get("hoops"),
        "access": t.get("access"),
        "fee": t.get("fee"),
        "opening_hours": t.get("opening_hours"),
        "operator": t.get("operator"),
        "website": t.get("website") or t.get("contact:website"),
        "address": ", ".join([x for x in [street, city] if x]),
        "has_name": bool(t.get("name")),
    }


@api_router.get("/courts")
async def courts(lat: float = Query(..., ge=-90, le=90), lon: float = Query(..., ge=-180, le=180), radius: int = Query(5000, ge=300, le=25000)):
    key = f"courts:{round(lat, 3)}:{round(lon, 3)}:{radius}"
    hit = cache_get(key, 60 * 30)
    if hit is not None:
        return hit
    q = f"""[out:json][timeout:25];
(
  nwr["sport"~"basketball"](around:{radius},{lat},{lon});
);
out center tags 300;"""
    last_err = None
    elements = None
    async with httpx.AsyncClient(timeout=30, headers=UA) as c:
        for url in OVERPASS_MIRRORS:
            try:
                r = await c.post(url, data={"data": q})
                if r.status_code in (429, 504):
                    last_err = f"{url} {r.status_code}"
                    continue
                r.raise_for_status()
                elements = r.json().get("elements", [])
                break
            except Exception as e:
                last_err = str(e)
                logger.warning("overpass mirror failed %s: %s", url, e)
    if elements is None:
        logger.error("all overpass mirrors failed: %s", last_err)
        raise HTTPException(503, "Court lookup servers are busy. Try again in a moment.")
    seen = set()
    out = []
    for e in elements:
        n = normalize_court(e, lat, lon)
        if not n:
            continue
        # de-duplicate courts mapped as both node + area at nearly same place
        k = (round(n["lat"], 4), round(n["lon"], 4))
        if k in seen:
            continue
        seen.add(k)
        out.append(n)
    out.sort(key=lambda x: x["distance_m"])
    result = {"center": {"lat": lat, "lon": lon}, "radius": radius, "count": len(out), "courts": out[:150]}
    cache_set(key, result)
    return result


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
