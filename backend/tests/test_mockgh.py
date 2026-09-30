"""Mock GitHub API tests for Song Coder tool."""
import base64
import os
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if "REACT_APP_BACKEND_URL" in os.environ else "https://music-catalog-sync.preview.emergentagent.com"
API = f"{BASE_URL}/api/mockgh"
TOKEN = "testtoken"
H = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}


@pytest.fixture(autouse=True)
def reset():
    requests.post(f"{API}/reset")
    yield


# --- basic state ---
def test_state_initial():
    r = requests.get(f"{API}/state")
    assert r.status_code == 200
    d = r.json()
    assert d["branches"] == ["main"]
    assert d["pulls"] == [] and d["commits"] == []


def test_raw_main_songs_seed_has_songs():
    r = requests.get(f"{API}/raw/main/content/songs.html")
    assert r.status_code == 200
    assert r.text.count('<ul class="song"') >= 50


# --- auth ---
def test_auth_missing_token():
    r = requests.get(f"{API}/repos/TreeshWoodz/Treesh")
    assert r.status_code == 401


def test_auth_bad_token():
    r = requests.get(f"{API}/repos/TreeshWoodz/Treesh", headers={"Authorization": "Bearer bad"})
    assert r.status_code == 401
    assert "Bad credentials" in r.json()["message"]


def test_auth_ok():
    r = requests.get(f"{API}/repos/TreeshWoodz/Treesh", headers=H)
    assert r.status_code == 200
    d = r.json()
    assert d["full_name"] == "TreeshWoodz/Treesh"
    assert d["default_branch"] == "main"
    assert d["permissions"]["push"] is True


# --- contents ---
def test_get_contents_returns_base64():
    r = requests.get(f"{API}/repos/TreeshWoodz/Treesh/contents/content/songs.html", headers=H)
    assert r.status_code == 200
    d = r.json()
    assert d["encoding"] == "base64"
    text = base64.b64decode(d["content"]).decode()
    assert '<ul class="song"' in text
    assert d["sha"]


def test_get_contents_missing():
    r = requests.get(f"{API}/repos/TreeshWoodz/Treesh/contents/does/not/exist", headers=H)
    assert r.status_code == 404


def test_put_contents_updates_main():
    g = requests.get(f"{API}/repos/TreeshWoodz/Treesh/contents/content/songs.html", headers=H).json()
    new_text = "hello world"
    body = {"message": "test", "content": base64.b64encode(new_text.encode()).decode(),
            "sha": g["sha"], "branch": "main"}
    r = requests.put(f"{API}/repos/TreeshWoodz/Treesh/contents/content/songs.html", headers=H, json=body)
    assert r.status_code == 200
    # verify
    raw = requests.get(f"{API}/raw/main/content/songs.html").text
    assert raw == "hello world"


def test_put_contents_sha_conflict():
    body = {"message": "x", "content": base64.b64encode(b"hi").decode(),
            "sha": "wrongsha", "branch": "main"}
    r = requests.put(f"{API}/repos/TreeshWoodz/Treesh/contents/content/songs.html", headers=H, json=body)
    assert r.status_code == 409


# --- branches ---
def test_get_ref_main():
    r = requests.get(f"{API}/repos/TreeshWoodz/Treesh/git/ref/heads/main", headers=H)
    assert r.status_code == 200
    assert r.json()["ref"] == "refs/heads/main"


def test_create_ref_new_branch():
    ref = requests.get(f"{API}/repos/TreeshWoodz/Treesh/git/ref/heads/main", headers=H).json()
    body = {"ref": "refs/heads/songcoder/test-1", "sha": ref["object"]["sha"]}
    r = requests.post(f"{API}/repos/TreeshWoodz/Treesh/git/refs", headers=H, json=body)
    assert r.status_code == 200
    st = requests.get(f"{API}/state").json()
    assert "songcoder/test-1" in st["branches"]


def test_create_ref_conflict():
    ref = requests.get(f"{API}/repos/TreeshWoodz/Treesh/git/ref/heads/main", headers=H).json()
    body = {"ref": "refs/heads/main", "sha": ref["object"]["sha"]}
    r = requests.post(f"{API}/repos/TreeshWoodz/Treesh/git/refs", headers=H, json=body)
    assert r.status_code == 422


# --- pulls ---
def test_create_pull_and_list():
    ref = requests.get(f"{API}/repos/TreeshWoodz/Treesh/git/ref/heads/main", headers=H).json()
    requests.post(f"{API}/repos/TreeshWoodz/Treesh/git/refs", headers=H,
                  json={"ref": "refs/heads/songcoder/pr-branch", "sha": ref["object"]["sha"]})
    r = requests.post(f"{API}/repos/TreeshWoodz/Treesh/pulls", headers=H,
                      json={"title": "Add song", "head": "songcoder/pr-branch", "base": "main", "body": "b"})
    assert r.status_code == 200
    pr = r.json()
    assert pr["number"] == 1
    assert pr["state"] == "open"
    lst = requests.get(f"{API}/repos/TreeshWoodz/Treesh/pulls", headers=H).json()
    assert any(p["number"] == 1 for p in lst)


# --- full PR flow: adding a song to a branch keeps main untouched ---
def test_pr_flow_isolation():
    ref = requests.get(f"{API}/repos/TreeshWoodz/Treesh/git/ref/heads/main", headers=H).json()
    br = "songcoder/add-night-drive-1"
    requests.post(f"{API}/repos/TreeshWoodz/Treesh/git/refs", headers=H,
                  json={"ref": f"refs/heads/{br}", "sha": ref["object"]["sha"]})
    # get file from new branch
    g = requests.get(f"{API}/repos/TreeshWoodz/Treesh/contents/content/songs.html?ref={br}", headers=H).json()
    original = base64.b64decode(g["content"]).decode()
    new_text = '<ul class="song" data-track="Night Drive"></ul>\n' + original
    requests.put(f"{API}/repos/TreeshWoodz/Treesh/contents/content/songs.html", headers=H,
                 json={"message": "add", "content": base64.b64encode(new_text.encode()).decode(),
                       "sha": g["sha"], "branch": br})
    # main untouched
    main_text = requests.get(f"{API}/raw/main/content/songs.html").text
    assert 'data-track="Night Drive"' not in main_text
    # branch updated - use contents endpoint since branch name has a slash
    br_data = requests.get(f"{API}/repos/TreeshWoodz/Treesh/contents/content/songs.html?ref={br}", headers=H).json()
    br_text = base64.b64decode(br_data["content"]).decode()
    assert 'data-track="Night Drive"' in br_text
