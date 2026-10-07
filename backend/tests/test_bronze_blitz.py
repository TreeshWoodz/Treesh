import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://starlites-arena.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ---------- /api root ----------
def test_root(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    assert "Bronze Blitz" in r.json().get("message", "")


# ---------- /api/scores ----------
def test_submit_score_valid(s):
    pid = f"TEST_{uuid.uuid4().hex[:8]}"
    r = s.post(f"{API}/scores", json={"player_id": pid, "name": "TEST_Alpha", "mode": "timed", "score": 1234})
    assert r.status_code == 200, r.text
    assert r.json().get("ok") is True


def test_submit_score_invalid_mode(s):
    r = s.post(f"{API}/scores", json={"player_id": "TEST_xyz1", "name": "TEST_x", "mode": "nope", "score": 100})
    assert r.status_code == 400


def test_submit_score_validation(s):
    # name too short
    r = s.post(f"{API}/scores", json={"player_id": "TEST_abcd", "name": "A", "mode": "timed", "score": 100})
    assert r.status_code == 422


# ---------- /api/leaderboard ----------
def test_leaderboard_best_per_player_desc(s):
    pid = f"TEST_{uuid.uuid4().hex[:8]}"
    name = "TEST_Lead"
    for sc in [100, 999, 500]:
        r = s.post(f"{API}/scores", json={"player_id": pid, "name": name, "mode": "moves", "score": sc})
        assert r.status_code == 200
    r = s.get(f"{API}/leaderboard/moves?limit=100")
    assert r.status_code == 200
    rows = r.json()
    mine = [x for x in rows if x["player_id"] == pid]
    assert len(mine) == 1, f"Expected single best-per-player row, got {len(mine)}"
    assert mine[0]["score"] == 999
    # Check sorted desc
    scores = [x["score"] for x in rows]
    assert scores == sorted(scores, reverse=True)
    # Check ranks sequential
    assert [x["rank"] for x in rows[:3]] == [1, 2, 3][: len(rows[:3])]


def test_leaderboard_invalid_mode(s):
    r = s.get(f"{API}/leaderboard/bogus")
    assert r.status_code == 400


def test_leaderboard_daily_filtered_today(s):
    pid = f"TEST_{uuid.uuid4().hex[:8]}"
    r = s.post(f"{API}/scores", json={"player_id": pid, "name": "TEST_Daily", "mode": "daily", "score": 777})
    assert r.status_code == 200
    r = s.get(f"{API}/leaderboard/daily")
    assert r.status_code == 200
    rows = r.json()
    assert any(x["player_id"] == pid and x["score"] == 777 for x in rows)


# ---------- /api/cloud/save and /api/cloud/load ----------
def test_cloud_save_new_and_update(s):
    pid = f"TEST_{uuid.uuid4().hex[:8]}"
    name = f"TEST_{uuid.uuid4().hex[:6]}"
    progress = {"starlites": 1000, "levelStars": {"1": 3}}
    r = s.post(f"{API}/cloud/save", json={"player_id": pid, "name": name, "progress": progress})
    assert r.status_code == 200, r.text
    data = r.json()
    code = data["save_code"]
    assert len(code) == 6

    # Update with matching code
    r2 = s.post(f"{API}/cloud/save", json={"player_id": pid, "name": name, "save_code": code, "progress": {"starlites": 2000}})
    assert r2.status_code == 200
    assert r2.json()["save_code"] == code

    # Update with wrong code => 403
    r3 = s.post(f"{API}/cloud/save", json={"player_id": pid, "name": name, "save_code": "WRONG1", "progress": {}})
    assert r3.status_code == 403

    # Load with correct code
    rl = s.post(f"{API}/cloud/load", json={"name": name, "save_code": code})
    assert rl.status_code == 200
    assert rl.json()["progress"]["starlites"] == 2000

    # Load with wrong code => 404
    rl2 = s.post(f"{API}/cloud/load", json={"name": name, "save_code": "WRONG1"})
    assert rl2.status_code == 404


def test_cloud_save_name_taken_by_other(s):
    name = f"TEST_{uuid.uuid4().hex[:6]}"
    pid1 = f"TEST_{uuid.uuid4().hex[:8]}"
    pid2 = f"TEST_{uuid.uuid4().hex[:8]}"
    r = s.post(f"{API}/cloud/save", json={"player_id": pid1, "name": name, "progress": {}})
    assert r.status_code == 200
    r2 = s.post(f"{API}/cloud/save", json={"player_id": pid2, "name": name, "progress": {}})
    assert r2.status_code == 409


def test_cloud_load_not_found(s):
    r = s.post(f"{API}/cloud/load", json={"name": f"TEST_{uuid.uuid4().hex[:6]}", "save_code": "ABCDEF"})
    assert r.status_code == 404
