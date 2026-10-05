"""Treesh M.A.D. mock backend tests — sign-in activity + PR state transitions."""
import os
import time
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
GH = f"{API}/github"
PASSCODE = "TreeshMAD-test-2026"


def _reset():
    requests.post(f"{API}/mockgh/reset")


@pytest.fixture
def anon():
    _reset()
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json",
                      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120",
                      "x-mock-city": "Brooklyn", "x-mock-country": "US"})
    return s


@pytest.fixture
def signed_in(anon):
    r = anon.post(f"{GH}/session", json={"passcode": PASSCODE})
    assert r.status_code == 200
    return anon


# --- /api/github/activity ---
def test_activity_requires_session(anon):
    r = anon.get(f"{GH}/activity")
    assert r.status_code == 401


def test_activity_logs_wrong_then_signin(anon):
    anon.post(f"{GH}/session", json={"passcode": "nope"})
    anon.post(f"{GH}/session", json={"passcode": "still-wrong"})
    r = anon.post(f"{GH}/session", json={"passcode": PASSCODE})
    assert r.status_code == 200
    a = anon.get(f"{GH}/activity")
    assert a.status_code == 200
    d = a.json()
    assert d["stored"] is True
    results = [e["result"] for e in d["entries"]]
    # newest first => signin first, then 2 wrongs
    assert results[0] == "signin"
    assert results.count("wrong") == 2
    # 2 failed tries in last 24h
    assert d["failed24h"] == 2
    # masked IP format
    for e in d["entries"]:
        assert "•••" in e["ip"] or e["ip"] == "Unknown"
        assert "device" in e
        assert "city" in e and "country" in e
    # Current flag on the signin entry
    signin = next(e for e in d["entries"] if e["result"] == "signin")
    assert signin["current"] is True
    # Wrong entries should NOT be current (sid=None)
    for e in d["entries"]:
        if e["result"] == "wrong":
            assert e["current"] is False
    # sid should never leak
    for e in d["entries"]:
        assert "sid" not in e


def test_wrong_passcode_message_shows_tries_left(anon):
    r = anon.post(f"{GH}/session", json={"passcode": "nope"})
    assert r.status_code == 401
    msg = r.json()["message"]
    assert "4 tries left" in msg
    r2 = anon.post(f"{GH}/session", json={"passcode": "nope"})
    assert "3 tries left" in r2.json()["message"]


# --- /api/mockgh/pulls/{n}/{action} ---
def _create_pr(sess, title="Edit song", branch="songcoder/edit-x"):
    ref = sess.get(f"{GH}/repo/git/ref/heads/main").json()
    sess.post(f"{GH}/repo/git/refs",
              json={"ref": f"refs/heads/{branch}", "sha": ref["object"]["sha"]})
    pr = sess.post(f"{GH}/repo/pulls",
                   json={"title": title, "head": branch, "base": "main", "body": "b"}).json()
    return pr


def test_pr_merge_close_reopen(signed_in):
    pr = _create_pr(signed_in, "Add song A", "songcoder/add-a")
    assert pr["state"] == "open"
    num = pr["number"]

    # merge
    r = requests.post(f"{API}/mockgh/pulls/{num}/merge")
    assert r.status_code == 200
    assert r.json()["state"] == "closed"
    assert r.json()["merged_at"]

    # list should now have merged PR when ?state=all
    pulls_all = signed_in.get(f"{GH}/repo/pulls?state=all").json()
    found = next(p for p in pulls_all if p["number"] == num)
    assert found["state"] == "closed" and found["merged_at"]

    # close via another PR
    pr2 = _create_pr(signed_in, "Blog post B", "songcoder/blog-b")
    r2 = requests.post(f"{API}/mockgh/pulls/{pr2['number']}/close")
    assert r2.status_code == 200
    assert r2.json()["state"] == "closed"
    assert r2.json()["merged_at"] is None

    # reopen
    r3 = requests.post(f"{API}/mockgh/pulls/{pr2['number']}/reopen")
    assert r3.status_code == 200
    assert r3.json()["state"] == "open"


def test_pr_action_404(signed_in):
    assert requests.post(f"{API}/mockgh/pulls/999/merge").status_code == 404
    pr = _create_pr(signed_in, "x", "songcoder/x")
    assert requests.post(f"{API}/mockgh/pulls/{pr['number']}/explode").status_code == 404
