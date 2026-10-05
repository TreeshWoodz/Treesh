"""Local mock of netlify/functions/github.mjs + GitHub REST API, used only to test songcoder.html in preview."""
import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import time
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException, Request, Response
from fastapi.responses import JSONResponse, PlainTextResponse
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

app = FastAPI()
api = APIRouter(prefix="/api")
REPO = "TreeshWoodz/Treesh"
COOKIE = "mad_session"
MAX_AGE = 60 * 60 * 24 * 30
SESSION_SECRET = secrets.token_hex(32)
FAILS = {}
SEED = {
    "content/songs.html": (ROOT_DIR / "mock_data/songs.html").read_text(encoding="utf-8"),
    "content/icons.html": (ROOT_DIR / "mock_data/icons.html").read_text(encoding="utf-8"),
    "content/lyrics.html": (ROOT_DIR / "mock_data/lyrics.html").read_text(encoding="utf-8"),
    "content/models.html": (ROOT_DIR / "mock_data/models.html").read_text(encoding="utf-8"),
}
STATE = {}


def sha_of(text):
    return hashlib.sha1(text.encode("utf-8")).hexdigest()


def reset_state():
    STATE.clear()
    STATE.update({"branches": {"main": dict(SEED)}, "pulls": [], "commits": []})


reset_state()


class GhError(Exception):
    def __init__(self, status, message, code=None):
        self.status, self.message, self.code = status, message, code


@app.exception_handler(GhError)
async def gh_error(_, exc):
    body = {"message": exc.message}
    if exc.code:
        body["code"] = exc.code
    return JSONResponse(body, status_code=exc.status, headers={"Cache-Control": "no-store"})


@app.exception_handler(HTTPException)
async def http_error(_, exc):
    return JSONResponse({"message": exc.detail}, status_code=exc.status_code)


def sign(data):
    return base64.urlsafe_b64encode(hmac.new(SESSION_SECRET.encode(), data.encode(), hashlib.sha256).digest()).decode().rstrip("=")


def new_session():
    exp = int(time.time() * 1000) + MAX_AGE * 1000
    data = base64.urlsafe_b64encode(json.dumps({"exp": exp}).encode()).decode().rstrip("=")
    return f"{data}.{sign(data)}", exp


def read_session(request):
    raw = request.cookies.get(COOKIE) or ""
    data, _, sig = raw.partition(".")
    if not data or not sig or not hmac.compare_digest(sig, sign(data)):
        return None
    try:
        payload = json.loads(base64.urlsafe_b64decode(data + "=" * (-len(data) % 4)))
    except Exception:
        return None
    return payload if payload.get("exp", 0) > time.time() * 1000 else None


def require_session(request):
    if request.method != "GET":
        origin = request.headers.get("origin")
        if origin and origin.split("://")[-1] != request.headers.get("host"):
            raise GhError(403, "Blocked: request did not come from this site.", "origin")
    if not read_session(request):
        raise GhError(401, "Signed out. Sign in to M.A.D. in Settings.", "session")


def set_cookie(response, value, max_age):
    response.set_cookie(COOKIE, value, max_age=max_age, path="/api/github", httponly=True, secure=True, samesite="strict")


def branch_files(name):
    if name not in STATE["branches"]:
        raise GhError(404, "Branch not found")
    return STATE["branches"][name]


@api.get("/")
async def root():
    return {"message": "Treesh M.A.D. mock (Netlify function + GitHub API)"}


@api.post("/mockgh/reset")
async def reset():
    reset_state()
    FAILS.clear()
    return {"ok": True}


@api.get("/mockgh/state")
async def mock_state():
    return {"branches": list(STATE["branches"].keys()), "pulls": STATE["pulls"], "commits": STATE["commits"]}


@api.get("/mockgh/raw/{path:path}")
async def raw(path: str, branch: str = "main"):
    return PlainTextResponse(branch_files(branch).get(path, ""))


@api.get("/github/session")
async def session_get(request: Request):
    s = read_session(request)
    return {"signedIn": bool(s), "expires": s["exp"] if s else None, "repo": REPO}


@api.delete("/github/session")
async def session_delete(response: Response):
    set_cookie(response, "", 0)
    return {"signedIn": False, "repo": REPO}


@api.post("/github/session")
async def session_post(request: Request, response: Response):
    ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown").split(",")[0].strip()
    f = FAILS.get(ip, {"n": 0, "until": 0})
    if f["until"] > time.time():
        raise GhError(429, f"Too many wrong tries. Wait {int((f['until'] - time.time()) // 60) + 1} min and try again.", "locked")
    try:
        body = await request.json()
    except Exception:
        body = {}
    passcode = body.get("passcode") if isinstance(body, dict) else None
    if not isinstance(passcode, str) or not hmac.compare_digest(hashlib.sha256(passcode.encode()).digest(), hashlib.sha256(os.environ["MAD_PASSCODE"].encode()).digest()):
        f["n"] += 1
        if f["n"] >= 5:
            f["n"], f["until"] = 0, time.time() + 15 * 60
        FAILS[ip] = f
        raise GhError(401, "Wrong passcode.", "passcode")
    FAILS.pop(ip, None)
    value, exp = new_session()
    set_cookie(response, value, MAX_AGE)
    return {"signedIn": True, "expires": exp, "repo": REPO}


@api.get("/github/repo")
async def repo_info(request: Request):
    require_session(request)
    return {"full_name": REPO, "default_branch": "main", "private": True,
            "permissions": {"admin": True, "push": True, "pull": True}}


@api.get("/github/repo/contents/{path:path}")
async def get_contents(path: str, request: Request, ref: str = "main"):
    require_session(request)
    files = branch_files(ref)
    if path not in files:
        raise GhError(404, "Not Found")
    text = files[path]
    return {"type": "file", "path": path, "sha": sha_of(text), "encoding": "base64",
            "content": base64.encodebytes(text.encode("utf-8")).decode()}


@api.put("/github/repo/contents/{path:path}")
async def put_contents(path: str, request: Request):
    require_session(request)
    body = await request.json()
    branch = body.get("branch") or "main"
    files = branch_files(branch)
    if path in files and body.get("sha") != sha_of(files[path]):
        raise GhError(409, f"{path} does not match {body.get('sha')}")
    text = base64.b64decode(body["content"]).decode("utf-8")
    files[path] = text
    commit = {"sha": sha_of(text + str(time.time())), "message": body.get("message"), "branch": branch}
    STATE["commits"].append(commit)
    return {"content": {"path": path, "sha": sha_of(text)}, "commit": commit}


@api.get("/github/repo/git/ref/heads/{branch:path}")
async def get_ref(branch: str, request: Request):
    require_session(request)
    files = branch_files(branch)
    return {"ref": f"refs/heads/{branch}", "object": {"sha": sha_of("".join(files.values())), "type": "commit"}}


@api.post("/github/repo/git/refs")
async def create_ref(request: Request):
    require_session(request)
    body = await request.json()
    name = body["ref"].replace("refs/heads/", "")
    if name in STATE["branches"]:
        raise GhError(422, "Reference already exists")
    STATE["branches"][name] = dict(STATE["branches"]["main"])
    return {"ref": body["ref"], "object": {"sha": body["sha"]}}


@api.post("/github/repo/pulls")
async def create_pull(request: Request):
    require_session(request)
    body = await request.json()
    number = len(STATE["pulls"]) + 1
    pr = {"number": number, "title": body["title"], "body": body.get("body", ""), "state": "open",
          "head": {"ref": body["head"]}, "base": {"ref": body["base"]},
          "html_url": f"https://github.com/{REPO}/pull/{number}",
          "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    STATE["pulls"].append(pr)
    return pr


@api.get("/github/repo/pulls")
async def list_pulls(request: Request, state: str = "open"):
    require_session(request)
    return [p for p in reversed(STATE["pulls"]) if state == "all" or p["state"] == state]


@api.api_route("/github/{rest:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def blocked(rest: str, request: Request):
    require_session(request)
    if not re.match(r"^repo(/|$)", rest):
        raise GhError(404, "Unknown M.A.D. route.", "route")
    raise GhError(403, "That GitHub action isn’t allowed through M.A.D.", "blocked")


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
