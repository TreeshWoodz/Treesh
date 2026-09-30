"""Mock GitHub REST API used only to test songcoder.html in the preview environment."""
import base64
import hashlib
import os
import time
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, Header, HTTPException, Request
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

app = FastAPI()
api = APIRouter(prefix="/api")
SEED = {
    "content/songs.html": (ROOT_DIR / "mock_data/songs.html").read_text(encoding="utf-8"),
    "content/icons.html": (ROOT_DIR / "mock_data/icons.html").read_text(encoding="utf-8"),
}
STATE = {}


def sha_of(text):
    return hashlib.sha1(text.encode("utf-8")).hexdigest()


def reset_state():
    STATE.clear()
    STATE.update({"branches": {"main": dict(SEED)}, "pulls": [], "commits": []})


reset_state()


def check_auth(authorization):
    token = (authorization or "").replace("Bearer ", "").strip()
    if not token or token == "bad":
        raise HTTPException(401, detail="Bad credentials")


def branch_files(name):
    if name not in STATE["branches"]:
        raise HTTPException(404, detail="Branch not found")
    return STATE["branches"][name]


@app.exception_handler(HTTPException)
async def gh_error(_, exc):
    from fastapi.responses import JSONResponse
    return JSONResponse({"message": exc.detail}, status_code=exc.status_code)


@api.get("/")
async def root():
    return {"message": "Song Coder mock GitHub API"}


@api.post("/mockgh/reset")
async def reset():
    reset_state()
    return {"ok": True}


@api.get("/mockgh/state")
async def state():
    return {"branches": list(STATE["branches"].keys()), "pulls": STATE["pulls"], "commits": STATE["commits"]}


@api.get("/mockgh/raw/{branch}/{path:path}")
async def raw(branch: str, path: str):
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(branch_files(branch).get(path, ""))


@api.get("/mockgh/repos/{owner}/{repo}")
async def repo_info(owner: str, repo: str, authorization: str = Header(None)):
    check_auth(authorization)
    return {"full_name": f"{owner}/{repo}", "default_branch": "main", "private": True,
            "permissions": {"admin": True, "push": True, "pull": True}}


@api.get("/mockgh/repos/{owner}/{repo}/contents/{path:path}")
async def get_contents(owner: str, repo: str, path: str, ref: str = "main", authorization: str = Header(None)):
    check_auth(authorization)
    files = branch_files(ref)
    if path not in files:
        raise HTTPException(404, detail="Not Found")
    text = files[path]
    return {"type": "file", "path": path, "sha": sha_of(text), "encoding": "base64",
            "content": base64.encodebytes(text.encode("utf-8")).decode()}


@api.put("/mockgh/repos/{owner}/{repo}/contents/{path:path}")
async def put_contents(owner: str, repo: str, path: str, request: Request, authorization: str = Header(None)):
    check_auth(authorization)
    body = await request.json()
    branch = body.get("branch") or "main"
    files = branch_files(branch)
    if path in files and body.get("sha") != sha_of(files[path]):
        raise HTTPException(409, detail=f"{path} does not match {body.get('sha')}")
    text = base64.b64decode(body["content"]).decode("utf-8")
    files[path] = text
    commit = {"sha": sha_of(text + str(time.time())), "message": body.get("message"), "branch": branch}
    STATE["commits"].append(commit)
    return {"content": {"path": path, "sha": sha_of(text)}, "commit": commit}


@api.get("/mockgh/repos/{owner}/{repo}/git/ref/heads/{branch:path}")
async def get_ref(owner: str, repo: str, branch: str, authorization: str = Header(None)):
    check_auth(authorization)
    files = branch_files(branch)
    return {"ref": f"refs/heads/{branch}", "object": {"sha": sha_of("".join(files.values())), "type": "commit"}}


@api.post("/mockgh/repos/{owner}/{repo}/git/refs")
async def create_ref(owner: str, repo: str, request: Request, authorization: str = Header(None)):
    check_auth(authorization)
    body = await request.json()
    name = body["ref"].replace("refs/heads/", "")
    if name in STATE["branches"]:
        raise HTTPException(422, detail="Reference already exists")
    STATE["branches"][name] = dict(STATE["branches"]["main"])
    return {"ref": body["ref"], "object": {"sha": body["sha"]}}


@api.post("/mockgh/repos/{owner}/{repo}/pulls")
async def create_pull(owner: str, repo: str, request: Request, authorization: str = Header(None)):
    check_auth(authorization)
    body = await request.json()
    number = len(STATE["pulls"]) + 1
    pr = {"number": number, "title": body["title"], "body": body.get("body", ""), "state": "open",
          "head": {"ref": body["head"]}, "base": {"ref": body["base"]},
          "html_url": f"https://github.com/{owner}/{repo}/pull/{number}",
          "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    STATE["pulls"].append(pr)
    return pr


@api.get("/mockgh/repos/{owner}/{repo}/pulls")
async def list_pulls(owner: str, repo: str, state: str = "open", authorization: str = Header(None)):
    check_auth(authorization)
    return [p for p in reversed(STATE["pulls"]) if state == "all" or p["state"] == state]


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
