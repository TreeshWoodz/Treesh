"""Local mock of netlify/functions/github.mjs + GitHub REST API, used only to test songcoder.html in preview."""
import base64
import calendar
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
# Mock Supabase: access_token -> Treesh profile (verified + verified_icon)
SUPA = {
    "mock-chelly": {"uid": "u-chelly", "name": "Chelly Banqz", "email": "chelly@treesh.app", "verified": True, "artistId": "11"},
    "mock-fan": {"uid": "u-fan", "name": "Jordan Fan", "email": "jordan@example.com", "verified": False, "artistId": ""},
    "mock-savionce": {"uid": "u-sav", "name": "SAVIONCE", "email": "sav@example.com", "verified": False, "artistId": ""},
}
ICONS = {"requests": {}, "approved": {}, "revoked": {}}
EMAILS = []  # mock Resend outbox: production sends via api.resend.com from github.mjs


def alert_to():
    for k in ("MAD_ALERT_EMAIL", "MAD_ALERT_KEY"):
        v = (os.environ.get(k) or "").strip()
        if re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", v):
            return v
    return ""


def mask_email(e):
    return re.sub(r"^(.)[^@]*(@.*)$", r"\1•••\2", e)


def send_alert(kind, subject, head, lines):
    if not alert_to():
        return {"ok": False, "message": "Email alerts aren’t set up. Add RESEND_API_KEY and MAD_ALERT_EMAIL in Netlify, then redeploy."}
    # Mock of the brand-sender fallback: mad@treesh.app until the domain is "verified" (MOCK_DOMAIN_VERIFIED=1), else Resend's test sender
    verified = os.environ.get("MOCK_DOMAIN_VERIFIED") == "1"
    sender = "mad@treesh.app" if verified else "onboarding@resend.dev"
    EMAILS.append({"kind": kind, "to": alert_to(), "from": sender, "subject": subject, "head": head, "lines": [[k, v] for k, v in lines if v], "t": int(time.time() * 1000)})
    return {"ok": True, "to": mask_email(alert_to()), "from": sender, "fallback": not verified}
ICON_FILES = ["content/songs.html", "content/icons.html", "content/lyrics.html"]
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
    STATE.update({"branches": {"main": dict(SEED)}, "pulls": [], "commits": [], "snapshots": {}, "bases": {}, "comments": []})
    for k in ICONS:
        ICONS[k].clear()
    EMAILS.clear()


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


def new_session(login=None, **extra):
    exp, sid = int(time.time() * 1000) + MAX_AGE * 1000, secrets.token_urlsafe(9)
    data = base64.urlsafe_b64encode(json.dumps({"exp": exp, "sid": sid, **({"login": login} if login else {}), **extra}).encode()).decode().rstrip("=")
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
    if payload.get("exp", 0) <= time.time() * 1000:
        return None
    if payload.get("role") == "icon" and ICONS["revoked"].get(payload.get("uid"), 0) > payload["exp"] - MAX_AGE * 1000:
        return None
    return payload


def require_session(request):
    if request.method != "GET":
        origin = request.headers.get("origin")
        hosts = {request.headers.get("host"), *[h.strip() for h in request.headers.get("x-forwarded-host", "").split(",")]}
        if origin and origin.split("://")[-1] not in hosts and request.headers.get("sec-fetch-site") != "same-origin":
            raise GhError(403, "Blocked: request did not come from this site.", "origin")
    s = read_session(request)
    if not s:
        raise GhError(401, "Signed out. Sign in to M.A.D. in Settings.", "session")
    return s


def require_admin(request):
    s = require_session(request)
    if s.get("role") == "icon":
        raise GhError(403, "That action isn’t available to icon accounts.", "icon_scope")
    return s


# ---- icon scope (mirror of blocksOf / scopeOk in github.mjs) ----
BLOCK_OPEN = re.compile(r"<!--[\s\S]*?-->|<(article|div|ul)\b((?:[^>\"']|\"[^\"]*\"|'[^']*')*)>", re.I)


def blocks_of(text):
    out, rest, last, pos = [], "", 0, 0
    while True:
        m = BLOCK_OPEN.search(text, pos)
        if not m:
            break
        pos = m.end()
        if not m.group(1):
            continue
        cm = re.search(r"\bclass\s*=\s*(?:\"([^\"]*)\"|'([^']*)')", m.group(2), re.I)
        if not cm or not any(re.fullmatch(r"artist|song|lyric|model", c, re.I) for c in (cm.group(1) or cm.group(2) or "").split()):
            continue
        tok, depth, end = re.compile(rf"<{m.group(1)}\b|</{m.group(1)}\s*>", re.I), 1, m.end()
        while depth:
            t = tok.search(text, end)
            if not t:
                break
            depth += -1 if t.group(0)[1] == "/" else 1
            end = t.end()
        if depth:
            break
        rest += text[last:m.start()]
        out.append(text[m.start():end])
        last = pos = end
    return out, rest + text[last:]


def attr_of(b, n):
    m = re.search(rf"\s{n}\s*=\s*(?:\"([^\"]*)\"|'([^']*)')", b[:b.find(">") + 1], re.I)
    return (m.group(1) if m.group(1) is not None else m.group(2)) if m else ""


def ids_of(b):
    return [x for x in re.split(r"[\s,]+", attr_of(b, "data-artist-id")) if x]


def title_key(s):
    return re.sub(r"[^a-z0-9]+", "", s.lower().replace("&amp;", "&"))


def owner_of(aid, titles):
    def own(b):
        cls = attr_of(b, "class")
        if re.search(r"\bmodel\b", cls, re.I):
            return False
        ids = ids_of(b)
        return aid in ids or (bool(re.search(r"\blyric\b", cls, re.I)) and not ids and title_key(attr_of(b, "data-track")) in titles)
    return own


def scope_ok(base, nxt, own):
    a, ra = blocks_of(base)
    b, rb = blocks_of(nxt)
    if re.sub(r"\s+", "", ra) != re.sub(r"\s+", "", rb):
        return False
    return "\n".join(x for x in a if not own(x)) == "\n".join(x for x in b if not own(x))


def icon_put_ok(sess, path, branch, text):
    pre = f"icon/{sess['artistId']}/"
    if path not in ICON_FILES:
        raise GhError(403, "Icons can’t edit that file.", "icon_scope")
    if not branch.startswith(pre):
        raise GhError(403, "Icon changes always go to admin review.", "icon_scope")
    titles = set()
    if path == "content/lyrics.html":
        for ref in ("main", branch):
            for x in blocks_of(STATE["branches"].get(ref, {}).get("content/songs.html", ""))[0]:
                if sess["artistId"] in ids_of(x):
                    titles.add(title_key(attr_of(x, "data-track")))
    if not scope_ok(STATE["branches"]["main"].get(path, ""), text, owner_of(sess["artistId"], titles)):
        raise GhError(403, "That change touches content that isn’t yours. Only your own profile, songs and lyrics can be edited.", "icon_scope")


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
    return {"branches": list(STATE["branches"].keys()), "pulls": STATE["pulls"], "commits": STATE["commits"], "comments": STATE["comments"], "icons": ICONS, "emails": EMAILS}


@api.get("/mockgh/raw/{path:path}")
async def raw(path: str, branch: str = "main"):
    return PlainTextResponse(branch_files(branch).get(path, ""))


@api.get("/github/session")
async def session_get(request: Request):
    s = read_session(request)
    return {"signedIn": bool(s), "expires": s["exp"] if s else None, "login": (s or {}).get("login"), "repo": REPO,
            "role": (s.get("role") or "admin") if s else None, "artistId": (s or {}).get("artistId"),
            "email": mask_email(alert_to()) if s and s.get("role") != "icon" and alert_to() else None,
            "version": "2026-10-09", "features": {"email": bool(alert_to()), "imagekit": True, "icons": True, "oauth": OAUTH["on"]},
            "activity": True, "oauth": OAUTH["on"]}


async def body_json(request):
    try:
        b = await request.json()
        return b if isinstance(b, dict) else {}
    except Exception:
        return {}


@api.post("/github/icon-session")
async def icon_session(request: Request, response: Response):
    body = await body_json(request)
    u = SUPA.get(body.get("access_token") or "")
    if not u:
        raise GhError(401, "Your Treesh sign-in has expired. Open treesh.app so it refreshes, then try again.", "icon_signin")
    ok = ICONS["approved"].get(u["uid"])
    aid = (ok or {}).get("artistId") or (u["artistId"] if u["verified"] else "")
    if not aid:
        return JSONResponse({"message": "Your Treesh account isn’t verified for M.A.D. yet.", "code": "icon_unverified", "name": u["name"],
                             "requested": u["uid"] in ICONS["requests"]}, status_code=403)
    value, exp, sid = new_session(u["name"], role="icon", artistId=aid, uid=u["uid"])
    log_event(request, client_ip(request), "signin", sid, via="treesh", login=u["name"])
    set_cookie(response, value, MAX_AGE)
    return {"signedIn": True, "role": "icon", "artistId": aid, "login": u["name"], "expires": exp, "repo": REPO}


@api.post("/github/icon-request")
async def icon_request(request: Request):
    body = await body_json(request)
    u = SUPA.get(body.get("access_token") or "")
    if not u:
        raise GhError(401, "Your Treesh sign-in has expired. Open treesh.app so it refreshes, then try again.", "icon_signin")
    fresh = u["uid"] not in ICONS["requests"]
    ICONS["requests"][u["uid"]] = {"uid": u["uid"], "name": u["name"], "email": u["email"], "artistId": re.sub(r"[^\w-]", "", str(body.get("artistId") or "")),
                                   "note": str(body.get("note") or "")[:300], "t": int(time.time() * 1000)}
    if fresh:
        r = ICONS["requests"][u["uid"]]
        send_alert("icon-access", f"{u['name']} asked for Icon access", f"{u['name']} asked for Icon access in M.A.D.",
                   [("Name", u["name"]), ("Email", u["email"]), ("Says they are", f"Icon #{r['artistId']}" if r["artistId"] else ""), ("Note", r["note"])])
    return {"ok": True}


@api.post("/github/icon-updates")
async def icon_updates(request: Request):
    body = await body_json(request)
    u = SUPA.get(body.get("access_token") or "")
    if not u:
        raise GhError(401, "Sign in to Treesh first.", "icon_signin")
    aid = (ICONS["approved"].get(u["uid"]) or {}).get("artistId") or (u["artistId"] if u["verified"] else "")
    if not aid:
        return {"updates": []}
    since = float(body.get("since") or 0)
    out = []
    for p in reversed(STATE["pulls"]):
        if p["state"] != "closed" or not p["head"]["ref"].startswith(f"icon/{aid}/"):
            continue
        at = calendar.timegm(time.strptime(p["closed_at"], "%Y-%m-%dT%H:%M:%SZ")) * 1000
        if at <= since:
            continue
        m = re.search(r"\*\*Not approved:\*\* ([\s\S]*?)\n<!-- mad-reject -->", p.get("body") or "")
        out.append({"number": p["number"], "title": re.sub(r"^[^:]+:\s*", "", p["title"]), "result": "approved" if p.get("merged_at") else "rejected",
                    "note": "" if p.get("merged_at") else (m.group(1) if m else ""), "at": at})
    return {"updates": out, "name": u["name"]}


@api.get("/github/icon-admin")
async def icon_admin_get(request: Request):
    require_admin(request)
    return {"requests": sorted(ICONS["requests"].values(), key=lambda r: -r["t"]), "approved": list(ICONS["approved"].values())}


@api.post("/github/icon-admin")
async def icon_admin_post(request: Request):
    require_admin(request)
    body = await body_json(request)
    uid = str(body.get("uid") or "")
    r = ICONS["requests"].get(uid) or ICONS["approved"].get(uid)
    if not r:
        raise GhError(404, "Request not found.", "icon_req")
    if body.get("action") == "approve":
        aid = re.sub(r"[^\w-]", "", str(body.get("artistId") or r.get("artistId") or ""))
        if not aid:
            raise GhError(400, "Pick which icon this account belongs to.", "icon_req")
        ICONS["approved"][uid] = {**r, "artistId": aid, "approvedAt": int(time.time() * 1000)}
    if body.get("action") == "revoke":
        ICONS["approved"].pop(uid, None)
        ICONS["revoked"][uid] = int(time.time() * 1000)
    ICONS["requests"].pop(uid, None)
    return {"ok": True}


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
    sess = require_admin(request)
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
    sess = require_session(request)
    body = await request.json()
    branch = body.get("branch") or "main"
    if sess.get("role") == "icon":
        icon_put_ok(sess, path, branch, base64.b64decode(body.get("content") or "").decode("utf-8"))
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
    sess = require_session(request)
    body = await request.json()
    if sess.get("role") == "icon" and not (str(body.get("ref", "")).startswith(f"refs/heads/icon/{sess['artistId']}/") and re.fullmatch(r"refs/heads/[\w./-]+", body["ref"])):
        raise GhError(403, "Icons can only create review branches.", "icon_scope")
    name = body["ref"].replace("refs/heads/", "")
    if name in STATE["branches"]:
        raise GhError(422, "Reference already exists")
    STATE["branches"][name] = dict(STATE["branches"]["main"])
    base_sha = "base-" + secrets.token_hex(6)
    STATE["snapshots"][base_sha] = dict(STATE["branches"]["main"])
    STATE["bases"][name] = base_sha
    return {"ref": body["ref"], "object": {"sha": body["sha"]}}


@api.post("/github/repo/pulls")
async def create_pull(request: Request):
    sess = require_session(request)
    body = await request.json()
    if sess.get("role") == "icon" and not (str(body.get("head", "")).startswith(f"icon/{sess['artistId']}/") and body.get("base") == "main"):
        raise GhError(403, "Icons can only open review requests.", "icon_scope")
    number = len(STATE["pulls"]) + 1
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    pr = {"number": number, "title": body["title"], "body": body.get("body", ""), "state": "open",
          "head": {"ref": body["head"]}, "base": {"ref": body["base"], "sha": STATE["bases"].get(body["head"], "main")}, "user": {"login": "treesh-mad"},
          "html_url": f"https://github.com/{REPO}/pull/{number}",
          "created_at": now, "updated_at": now, "closed_at": None, "merged_at": None}
    STATE["pulls"].append(pr)
    if sess.get("role") == "icon":
        who = sess.get("login") or "An Icon"
        send_alert("icon-change", f"{who} sent a change for review", f"{who} sent a change for review",
                   [("Icon", f"{who} (#{sess['artistId']})"), ("Change", re.sub(r"^[^:]+:\s*", "", pr["title"])), ("Request", f"#{number}")])
    return pr


@api.post("/github/alert-test")
async def alert_test(request: Request):
    require_admin(request)
    r = send_alert("test", "M.A.D. email alerts are working", "Email alerts are working", [("Sent to", alert_to()), ("You’ll get", "New icon changes and Icon access requests")])
    if not r["ok"]:
        raise GhError(502, r["message"], "email")
    return r


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
    sess = require_session(request)
    mine = (lambda p: p["head"]["ref"].startswith(f"icon/{sess['artistId']}/")) if sess.get("role") == "icon" else (lambda p: True)
    return [p for p in reversed(STATE["pulls"]) if (state == "all" or p["state"] == state) and mine(p)][:per_page]


def find_pr(number):
    pr = next((p for p in STATE["pulls"] if p["number"] == number), None)
    if not pr:
        raise GhError(404, "Not Found")
    return pr


@api.get("/github/repo/pulls/{number}/files")
async def pull_files(number: int, request: Request):
    require_session(request)
    pr = find_pr(number)
    base, head = STATE["snapshots"].get(pr["base"]["sha"], STATE["branches"]["main"]), STATE["branches"].get(pr["head"]["ref"], {})
    return [{"filename": k, "status": "added" if k not in base else "modified"} for k in head if head[k] != base.get(k)]


@api.put("/github/repo/pulls/{number}/merge")
async def pull_merge(number: int, request: Request):
    require_admin(request)
    pr = find_pr(number)
    if pr["state"] != "open":
        raise GhError(405, "Pull Request is not mergeable")
    base, head, main = STATE["snapshots"].get(pr["base"]["sha"], {}), STATE["branches"].get(pr["head"]["ref"], {}), STATE["branches"]["main"]
    for k, v in head.items():
        if v != base.get(k):
            if main.get(k) != base.get(k) and k in main:
                raise GhError(405, "Pull Request is not mergeable")
            main[k] = v
            STATE["commits"].append({"sha": sha_of(v + str(time.time())), "message": pr["title"], "branch": "main", "path": k, "date": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())})
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    pr.update({"state": "closed", "merged_at": now, "closed_at": now, "updated_at": now})
    return {"merged": True, "message": "Pull Request successfully merged", "sha": sha_of(now)}


@api.patch("/github/repo/pulls/{number}")
async def pull_patch(number: int, request: Request):
    require_admin(request)
    pr, body = find_pr(number), await body_json(request)
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    if "body" in body:
        pr["body"] = body["body"]
    if body.get("state") == "closed" and pr["state"] == "open":
        pr.update({"state": "closed", "closed_at": now})
    pr["updated_at"] = now
    return pr


@api.post("/github/repo/issues/{number}/comments")
async def issue_comment(number: int, request: Request):
    require_admin(request)
    body = await body_json(request)
    STATE["comments"].append({"number": number, "body": body.get("body", "")})
    return {"id": len(STATE["comments"]), "body": body.get("body", "")}


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
