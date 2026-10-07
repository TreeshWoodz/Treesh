"""Backend API tests for Ebonics game by Treesh Games"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else "https://trophy-hustle.preview.emergentagent.com"
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- health ----------
def test_root(session):
    r = session.get(f"{API}/", timeout=15)
    assert r.status_code == 200
    assert "Ebonics" in r.json().get("message", "")


# ---------- leaderboard ----------
class TestLeaderboard:
    def test_submit_and_fetch(self, session):
        pid = f"TEST_{uuid.uuid4().hex[:16]}"
        payload = {"player_id": pid, "username": "TEST_user", "mode": "say_less", "score": 500}
        r = session.post(f"{API}/leaderboard", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["score"] == 500
        assert data["username"] == "TEST_user"
        assert data["mode"] == "say_less"
        assert "_id" not in data  # ensure ObjectId excluded

        # fetch
        r2 = session.get(f"{API}/leaderboard?mode=say_less&limit=100", timeout=15)
        assert r2.status_code == 200
        rows = r2.json()
        assert any(x["player_id"] == pid and x["score"] == 500 for x in rows)

    def test_max_score_only(self, session):
        pid = f"TEST_{uuid.uuid4().hex[:16]}"
        session.post(f"{API}/leaderboard", json={"player_id": pid, "username": "TEST_max", "mode": "say_less", "score": 800}, timeout=15)
        # submit lower - should NOT overwrite
        r = session.post(f"{API}/leaderboard", json={"player_id": pid, "username": "TEST_max", "mode": "say_less", "score": 100}, timeout=15)
        assert r.status_code == 200
        assert r.json()["score"] == 800

    def test_invalid_mode_submit(self, session):
        r = session.post(f"{API}/leaderboard", json={"player_id": "TEST_" + uuid.uuid4().hex[:10], "username": "x1", "mode": "bogus", "score": 5}, timeout=15)
        assert r.status_code == 400

    def test_invalid_mode_get(self, session):
        r = session.get(f"{API}/leaderboard?mode=bogus", timeout=15)
        assert r.status_code == 400

    def test_username_length_validation(self, session):
        r = session.post(f"{API}/leaderboard", json={"player_id": "TEST_" + uuid.uuid4().hex[:10], "username": "x", "mode": "say_less", "score": 10}, timeout=15)
        assert r.status_code == 422
        r = session.post(f"{API}/leaderboard", json={"player_id": "TEST_" + uuid.uuid4().hex[:10], "username": "x" * 25, "mode": "say_less", "score": 10}, timeout=15)
        assert r.status_code == 422


# ---------- AI endpoints ----------
class TestAI:
    def test_ai_questions(self, session):
        r = session.post(f"{API}/ai/questions", json={"count": 3, "avoid": []}, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "questions" in data
        qs = data["questions"]
        assert len(qs) >= 1
        q = qs[0]
        assert set(["term", "prompt", "options", "answer", "explanation"]).issubset(q.keys())
        assert len(q["options"]) == 4
        assert isinstance(q["answer"], int) and 0 <= q["answer"] < 4

    def test_flip_judge(self, session):
        r = session.post(
            f"{API}/flip/judge",
            json={"prompt": "I am going to the store.", "direction": "to_aave", "answer": "I'm finna hit the store."},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert 0 <= data["score"] <= 100
        assert isinstance(data["verdict"], str)
        assert isinstance(data["feedback"], str)


# ---------- cleanup ----------
def test_zz_cleanup(session):
    # No DELETE endpoint; best-effort doc that these TEST_ entries aren't excessive
    r = session.get(f"{API}/leaderboard?mode=say_less&limit=100", timeout=15)
    assert r.status_code == 200
