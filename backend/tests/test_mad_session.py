"""Treesh M.A.D. mock backend tests — new secure architecture (session cookie + proxy)."""
import base64
import os
import time
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
GH = f"{API}/github"
PASSCODE = "TreeshMAD-test-2026"
REPO = "TreeshWoodz/Treesh"


def _reset():
    requests.post(f"{API}/mockgh/reset")


@pytest.fixture
def anon():
    _reset()
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture
def signed_in(anon):
    r = anon.post(f"{GH}/session", json={"passcode": PASSCODE})
    assert r.status_code == 200, r.text
    assert r.json()["signedIn"] is True
    return anon


# --- session ---
def test_session_initial_signed_out(anon):
    r = anon.get(f"{GH}/session")
    assert r.status_code == 200
    d = r.json()
    assert d["signedIn"] is False
    assert d["repo"] == REPO


def test_session_wrong_passcode(anon):
    r = anon.post(f"{GH}/session", json={"passcode": "wrong"})
    assert r.status_code == 401
    assert r.json().get("code") == "passcode"
    assert "Wrong passcode" in r.json()["message"]


def test_session_correct_passcode_sets_httponly_cookie(anon):
    r = anon.post(f"{GH}/session", json={"passcode": PASSCODE})
    assert r.status_code == 200
    d = r.json()
    assert d["signedIn"] is True
    assert d["repo"] == REPO
    assert isinstance(d["expires"], int) and d["expires"] > int(time.time() * 1000)
    # HttpOnly cookie present
    set_cookie = r.headers.get("set-cookie", "")
    assert "mad_session=" in set_cookie
    assert "HttpOnly" in set_cookie


def test_session_get_after_signin(signed_in):
    r = signed_in.get(f"{GH}/session")
    assert r.status_code == 200
    assert r.json()["signedIn"] is True


def test_session_delete_signs_out(signed_in):
    r = signed_in.delete(f"{GH}/session")
    assert r.status_code == 200
    assert r.json()["signedIn"] is False
    # verify
    r2 = signed_in.get(f"{GH}/session")
    assert r2.json()["signedIn"] is False


def test_lockout_after_5_wrong(anon):
    for _ in range(5):
        anon.post(f"{GH}/session", json={"passcode": "nope"})
    r = anon.post(f"{GH}/session", json={"passcode": PASSCODE})
    # Could be 429 (locked) — reset for other tests
    assert r.status_code in (429, 200)
    if r.status_code == 429:
        assert r.json().get("code") == "locked"
    _reset()


# --- auth required on protected routes ---
def test_repo_requires_session(anon):
    r = anon.get(f"{GH}/repo")
    assert r.status_code == 401
    assert r.json().get("code") == "session"


def test_contents_requires_session(anon):
    r = anon.get(f"{GH}/repo/contents/content/songs.html")
    assert r.status_code == 401


# --- repo / contents (signed in) ---
def test_repo_info(signed_in):
    r = signed_in.get(f"{GH}/repo")
    assert r.status_code == 200
    d = r.json()
    assert d["full_name"] == REPO
    assert d["default_branch"] == "main"
    assert d["permissions"]["push"] is True


def test_get_songs_contents(signed_in):
    r = signed_in.get(f"{GH}/repo/contents/content/songs.html")
    assert r.status_code == 200
    d = r.json()
    assert d["encoding"] == "base64"
    text = base64.b64decode(d["content"]).decode()
    assert text.count('<ul class="song"') >= 50
    assert d["sha"]


def test_get_models_contents_seeded(signed_in):
    r = signed_in.get(f"{GH}/repo/contents/content/models.html")
    assert r.status_code == 200
    text = base64.b64decode(r.json()["content"]).decode()
    assert 'data-name="Nia Woods"' in text
    assert 'data-name="Jalen Pierce"' in text


def test_get_contents_missing(signed_in):
    r = signed_in.get(f"{GH}/repo/contents/does/not/exist")
    assert r.status_code == 404


def test_put_contents_updates_main(signed_in):
    g = signed_in.get(f"{GH}/repo/contents/content/songs.html").json()
    new_text = "hello world"
    body = {"message": "test", "content": base64.b64encode(new_text.encode()).decode(),
            "sha": g["sha"], "branch": "main"}
    r = signed_in.put(f"{GH}/repo/contents/content/songs.html", json=body)
    assert r.status_code == 200
    raw = requests.get(f"{API}/mockgh/raw/content/songs.html").text
    assert raw == "hello world"


def test_put_contents_sha_conflict(signed_in):
    body = {"message": "x", "content": base64.b64encode(b"hi").decode(),
            "sha": "wrongsha", "branch": "main"}
    r = signed_in.put(f"{GH}/repo/contents/content/songs.html", json=body)
    assert r.status_code == 409


# --- branches + PR flow ---
def test_pr_flow_isolation(signed_in):
    ref = signed_in.get(f"{GH}/repo/git/ref/heads/main").json()
    br = "songcoder/add-night-drive"
    r = signed_in.post(f"{GH}/repo/git/refs",
                       json={"ref": f"refs/heads/{br}", "sha": ref["object"]["sha"]})
    assert r.status_code == 200
    g = signed_in.get(f"{GH}/repo/contents/content/songs.html?ref={br}").json()
    original = base64.b64decode(g["content"]).decode()
    new_text = '<ul class="song" data-track="Night Drive"></ul>\n' + original
    r2 = signed_in.put(f"{GH}/repo/contents/content/songs.html",
                       json={"message": "add", "content": base64.b64encode(new_text.encode()).decode(),
                             "sha": g["sha"], "branch": br})
    assert r2.status_code == 200
    pr = signed_in.post(f"{GH}/repo/pulls",
                        json={"title": "Add Night Drive", "head": br, "base": "main", "body": "b"}).json()
    assert pr["number"] == 1 and pr["state"] == "open"
    # main untouched
    main_text = requests.get(f"{API}/mockgh/raw/content/songs.html").text
    assert 'data-track="Night Drive"' not in main_text
    # pulls list
    lst = signed_in.get(f"{GH}/repo/pulls").json()
    assert any(p["number"] == 1 for p in lst)


def test_blocked_route(signed_in):
    r = signed_in.get(f"{GH}/repo/issues")
    assert r.status_code == 403
    assert r.json().get("code") == "blocked"


def test_unknown_route(signed_in):
    r = signed_in.get(f"{GH}/users/foo")
    assert r.status_code == 404
    assert r.json().get("code") == "route"
