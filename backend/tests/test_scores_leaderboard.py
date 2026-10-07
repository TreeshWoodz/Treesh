"""Backend tests for Sonoko: /api/scores and /api/leaderboard."""
import os
import pytest
import requests
from datetime import date

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://puzzle-card-blend.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    yield s
    # Cleanup via mongo
    try:
        from pymongo import MongoClient
        mc = MongoClient("mongodb://localhost:27017")
        mc["test_database"]["scores"].delete_many({"name": {"$regex": "^TEST_"}})
    except Exception as e:
        print(f"cleanup failed: {e}")


def test_root(client):
    r = client.get(f"{API}/")
    assert r.status_code == 200
    assert "Sonoko" in r.json().get("message", "")


@pytest.mark.parametrize("mode", ["sonoko", "sudoku", "uno"])
def test_submit_and_leaderboard(client, mode):
    payload = {"name": f"TEST_{mode}", "mode": mode, "score": 1234}
    r = client.post(f"{API}/scores", json=payload)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "id" in body and "rank" in body
    assert isinstance(body["rank"], int) and body["rank"] >= 1

    # leaderboard
    r2 = client.get(f"{API}/leaderboard", params={"mode": mode})
    assert r2.status_code == 200
    data = r2.json()
    assert isinstance(data, list)
    # id present, not _id
    for row in data:
        assert "id" in row
        assert "_id" not in row
    # sorted desc by score
    scores = [row["score"] for row in data]
    assert scores == sorted(scores, reverse=True)
    # our entry present
    assert any(row["name"] == f"TEST_{mode}" and row["score"] == 1234 for row in data)


def test_daily_requires_date(client):
    today = date.today().isoformat()
    r = client.post(f"{API}/scores", json={"name": "TEST_daily", "mode": "daily", "score": 500, "date": today})
    assert r.status_code == 200
    # Fetch with date filter
    r2 = client.get(f"{API}/leaderboard", params={"mode": "daily", "date": today})
    assert r2.status_code == 200
    data = r2.json()
    assert any(row["name"] == "TEST_daily" for row in data)
    # Different date should not show it
    r3 = client.get(f"{API}/leaderboard", params={"mode": "daily", "date": "1999-01-01"})
    assert r3.status_code == 200
    assert not any(row["name"] == "TEST_daily" for row in r3.json())


def test_invalid_mode(client):
    r = client.post(f"{API}/scores", json={"name": "TEST_bad", "mode": "invalid", "score": 1})
    assert r.status_code == 422
    r2 = client.get(f"{API}/leaderboard", params={"mode": "invalid"})
    assert r2.status_code == 422


def test_invalid_score(client):
    r = client.post(f"{API}/scores", json={"name": "TEST_neg", "mode": "sonoko", "score": -1})
    assert r.status_code == 422


def test_invalid_date_format(client):
    r = client.post(f"{API}/scores", json={"name": "TEST_bd", "mode": "daily", "score": 1, "date": "01-01-2026"})
    assert r.status_code == 422


def test_rank_calculation(client):
    # Insert two scores and verify rank ordering
    r1 = client.post(f"{API}/scores", json={"name": "TEST_rank_hi", "mode": "sonoko", "score": 99999})
    r2 = client.post(f"{API}/scores", json={"name": "TEST_rank_lo", "mode": "sonoko", "score": 10})
    assert r1.json()["rank"] <= r2.json()["rank"]
