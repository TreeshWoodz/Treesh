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
from fastapi.responses import HTMLResponse, JSONResponse, PlainTextResponse, RedirectResponse
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
OAUTH = {"on": True}
ALLOWED_USERS = ["TreeshWoodz"]
ACTIVITY = []
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
    STATE.update({"branches": {"main": dict(SEED)}, "pulls": [], "commits": [], "snapshots": {}})


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


def new_session(login=None):
    exp, sid = int(time.time() * 1000) + MAX_AGE * 1000, secrets.token_urlsafe(9)
    data = base64.urlsafe_b64encode(json.dumps({"exp": exp, "sid": sid, **({"login": login} if login else {})}).encode()).decode().rstrip("=")
    return f"{data}.{sign(data)}", exp, sid


def mask_ip(ip):
    if not ip or ip == "unknown":
        return "Unknown"
    if "." in ip:
        return ".".join(ip.split(".")[:2]) + ".•••.•••"
    return ":".join([x for x in ip.split(":") if x][:2]) + ":••••"


def device(ua):
    os_name = next((n for k, n in [("iPhone", "iPhone"), ("iPad", "iPad"), ("Android", "Android"), ("Mac OS X", "Mac"), ("Windows", "Windows"), ("CrOS", "Chromebook"), ("Linux", "Linux")] if k in ua), "Unknown device")
    if re.search(r"EdgiOS|Edg/", ua):
        br = "Edge"
    elif "SamsungBrowser" in ua:
        br = "Samsung Internet"
    elif re.search(r"CriOS|Chrome/", ua):
        br = "Chrome"
    elif re.search(r"FxiOS|Firefox/", ua):
        br = "Firefox"
    elif "Safari/" in ua:
        br = "Safari"
    elif re.search(r"curl|python|node|axios|wget", ua, re.I):
        br = "Script / bot"
    else:
        br = "Unknown browser"
    return f"{os_name} · {br}"


def log_event(request, ip, result, sid=None, **extra):
    entry = {"t": int(time.time() * 1000), "result": result, "city": request.headers.get("x-mock-city", ""),
             "country": request.headers.get("x-mock-country", ""), "device": device(request.headers.get("user-agent", "")),
             "ip": mask_ip(ip), **extra}
    if sid:
        entry["sid"] = sid
    ACTIVITY.insert(0, entry)
    del ACTIVITY[100:]


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
        hosts = {request.headers.get("host"), *[h.strip() for h in request.headers.get("x-forwarded-host", "").split(",")]}
        if origin and origin.split("://")[-1] not in hosts and request.headers.get("sec-fetch-site") != "same-origin":
            raise GhError(403, "Blocked: request did not come from this site.", "origin")
    if not read_session(request):
        raise GhError(401, "Signed out. Sign in to M.A.D. in Settings.", "session")


def set_cookie(response, value, max_age):
    response.set_cookie(COOKIE, value, max_age=max_age, path="/api/github", httponly=True, secure=True, samesite="lax")


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
    ACTIVITY.clear()
    OAUTH["on"] = True
    return {"ok": True}


@api.post("/mockgh/pulls/{number}/{action}")
async def mock_pull_action(number: int, action: str):
    pr = next((p for p in STATE["pulls"] if p["number"] == number), None)
    if not pr or action not in ("merge", "close", "reopen"):
        raise GhError(404, "Not Found")
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    pr["state"] = "open" if action == "reopen" else "closed"
    pr["closed_at"] = None if action == "reopen" else now
    pr["merged_at"] = now if action == "merge" else None
    pr["updated_at"] = now
    return pr


@api.get("/mockgh/state")
async def mock_state():
    return {"branches": list(STATE["branches"].keys()), "pulls": STATE["pulls"], "commits": STATE["commits"]}


@api.get("/mockgh/raw/{path:path}")
async def raw(path: str, branch: str = "main"):
    return PlainTextResponse(branch_files(branch).get(path, ""))


@api.get("/github/session")
async def session_get(request: Request):
    s = read_session(request)
    return {"signedIn": bool(s), "expires": s["exp"] if s else None, "login": (s or {}).get("login"), "repo": REPO,
            "activity": True, "oauth": OAUTH["on"]}


def client_ip(request):
    return request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown").split(",")[0].strip()


def safe_return(r):
    return r if isinstance(r, str) and re.match(r"^/(?![/\\])[\w\-./]*$", r) else "/songcoder.html"


@api.post("/mockgh/oauth/{mode}")
async def mock_oauth_mode(mode: str):
    OAUTH["on"] = mode == "on"
    return OAUTH


@api.get("/github/oauth/start")
async def oauth_start(request: Request):
    ret = safe_return(request.query_params.get("return"))
    if not OAUTH["on"]:
        return RedirectResponse(f"{ret}?signin=setup", 302)
    state = secrets.token_urlsafe(24)
    # Mock GitHub: skip github.com and go straight to the callback. ?as=<login> picks the GitHub account, ?deny=1 simulates Cancel.
    qp = request.query_params
    q = f"error={qp['fail']}&state={state}" if qp.get("fail") else "error=access_denied" if qp.get("deny") else f"code=mock-{qp.get('as', 'TreeshWoodz')}&state={state}"
    r = RedirectResponse(f"/api/github/oauth/callback?{q}", 302)
    r.set_cookie("mad_oauth", f"{state}.{base64.urlsafe_b64encode(ret.encode()).decode().rstrip('=')}", max_age=600, path="/api/github/oauth", httponly=True, secure=True, samesite="lax")
    return r


@api.get("/github/oauth/callback")
async def oauth_callback(request: Request):
    saved, _, ret_b64 = (request.cookies.get("mad_oauth") or "").partition(".")
    try:
        ret = safe_return(base64.urlsafe_b64decode(ret_b64 + "=" * (-len(ret_b64) % 4)).decode())
    except Exception:
        ret = "/songcoder.html"
    q = request.query_params
    cookie_val, why = None, ""
    if q.get("error") == "access_denied":
        result = "cancelled"
    elif q.get("error") or not saved or not q.get("state") or not hmac.compare_digest(saved, q["state"]) or not q.get("code", "").startswith("mock-"):
        result, why = "error", q.get("error") or "state_mismatch"
        log_event(request, client_ip(request), "gh_error", via="github", why=why)
    else:
        login = q["code"][5:]
        ip = client_ip(request)
        if login.lower() not in [u.lower() for u in ALLOWED_USERS]:
            log_event(request, ip, "denied", via="github", login=login)
            result, why = "denied", login
        else:
            cookie_val, _, sid = new_session(login)
            log_event(request, ip, "signin", sid, via="github", login=login)
            result = "github"
    r = HTMLResponse(f'<!doctype html><body>Signing you in…<script>location.replace({json.dumps(f"{ret}?signin={result}" + (f"&why={why}" if why else ""))})</script>')
    r.delete_cookie("mad_oauth", path="/api/github/oauth")
    if cookie_val:
        set_cookie(r, cookie_val, MAX_AGE)
    return r


@api.delete("/github/session")
async def session_delete(response: Response):
    set_cookie(response, "", 0)
    return {"signedIn": False, "repo": REPO}


@api.post("/github/session")
async def session_post(request: Request, response: Response):
    ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown").split(",")[0].strip()
    f = FAILS.get(ip, {"n": 0, "until": 0})
    if f["until"] > time.time():
        log_event(request, ip, "locked")
        raise GhError(429, f"Too many wrong tries. Wait {int((f['until'] - time.time()) // 60) + 1} min and try again.", "locked")
    try:
        body = await request.json()
    except Exception:
        body = {}
    passcode = body.get("passcode") if isinstance(body, dict) else None
    if not isinstance(passcode, str) or not hmac.compare_digest(hashlib.sha256(passcode.strip().encode()).digest(), hashlib.sha256(os.environ["MAD_PASSCODE"].strip().encode()).digest()):
        f["n"] += 1
        locked = f["n"] >= 5
        if locked:
            f["n"], f["until"] = 0, time.time() + 15 * 60
        FAILS[ip] = f
        log_event(request, ip, "locked" if locked else "wrong")
        if locked:
            raise GhError(429, "Too many wrong tries. Sign-in is locked for 15 min.", "locked")
        left = 5 - f["n"]
        raise GhError(401, f"Wrong passcode. {left} {'try' if left == 1 else 'tries'} left before a 15 min lock.", "passcode")
    FAILS.pop(ip, None)
    value, exp, sid = new_session()
    log_event(request, ip, "signin", sid)
    set_cookie(response, value, MAX_AGE)
    return {"signedIn": True, "expires": exp, "repo": REPO}


@api.get("/github/activity")
async def activity(request: Request):
    require_session(request)
    sess = read_session(request)
    day = time.time() * 1000 - 864e5
    return {"stored": True, "failed24h": len([e for e in ACTIVITY if e["t"] > day and e["result"] != "signin"]),
            "entries": [{**{k: v for k, v in e.items() if k != "sid"}, "current": e.get("sid") == sess.get("sid")} for e in ACTIVITY]}


@api.get("/github/repo")
async def repo_info(request: Request):
    require_session(request)
    return {"full_name": REPO, "default_branch": "main", "private": True,
            "permissions": {"admin": True, "push": True, "pull": True}}


@api.get("/github/repo/contents/{path:path}")
async def get_contents(path: str, request: Request, ref: str = "main"):
    require_session(request)
    files = STATE["snapshots"].get(ref) or branch_files(ref)
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
    commit = {"sha": sha_of(text + str(time.time())), "message": body.get("message"), "branch": branch, "path": path,
              "date": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    STATE["commits"].append(commit)
    STATE["snapshots"][commit["sha"]] = dict(files)
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
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    pr = {"number": number, "title": body["title"], "body": body.get("body", ""), "state": "open",
          "head": {"ref": body["head"]}, "base": {"ref": body["base"]}, "user": {"login": "treesh-mad"},
          "html_url": f"https://github.com/{REPO}/pull/{number}",
          "created_at": now, "updated_at": now, "closed_at": None, "merged_at": None}
    STATE["pulls"].append(pr)
    return pr


@api.get("/github/imagekit-auth")
async def imagekit_auth(request: Request):
    require_session(request)
    token, expire = secrets.token_hex(16), int(time.time()) + 600
    return {"token": token, "expire": expire, "signature": hmac.new(b"mock-private", f"{token}{expire}".encode(), "sha1").hexdigest(),
            "publicKey": "public_mock", "folder": "/mad", "uploadUrl": "/api/mockgh/imagekit-upload"}


@api.post("/mockgh/imagekit-upload")
async def mock_imagekit_upload(request: Request):
    body = await request.body()
    if b'name="signature"' not in body or b'name="publicKey"' not in body:
        raise GhError(400, "Missing ImageKit auth fields")
    m = re.search(rb'name="fileName"\r\n\r\n([^\r]+)', body)
    name = (m.group(1).decode() if m else "image.png")
    return {"url": f"https://ik.imagekit.io/treesh/mad/{secrets.token_hex(3)}-{name}", "fileId": secrets.token_hex(8), "name": name}


@api.get("/github/repo/commits")
async def list_commits(request: Request, path: str = "", sha: str = "main", per_page: int = 30):
    require_session(request)
    hits = [c for c in reversed(STATE["commits"]) if c["branch"] == sha and (not path or c["path"] == path)][:per_page]
    return [{"sha": c["sha"], "html_url": f"https://github.com/{REPO}/commit/{c['sha']}", "author": {"login": "TreeshWoodz"},
             "commit": {"message": c["message"], "author": {"name": "TreeshWoodz", "date": c["date"]}}} for c in hits]


@api.get("/github/repo/pulls")
async def list_pulls(request: Request, state: str = "open", per_page: int = 30):
    require_session(request)
    return [p for p in reversed(STATE["pulls"]) if state == "all" or p["state"] == state][:per_page]


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
