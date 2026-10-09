"""Icon-updates endpoint tests (iteration 19).

Covers POST /api/github/icon-updates used by the treesh.app notice script:
- 401 for bad token
- [] for unverified icon token (no approved + not verified)
- Returns only this icon's closed PRs after `since` with correct result/note mapping
"""
import base64
import os
import re

import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
HEADERS_POST = {"Content-Type": "application/json", "Origin": BASE_URL}
MAD_PASSCODE = os.environ.get("MAD_PASSCODE", "TreeshMAD-test-2026")


def reset():
    r = requests.post(f"{API}/mockgh/reset", headers=HEADERS_POST, timeout=10)
    assert r.status_code == 200


def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/github/session", json={"passcode": MAD_PASSCODE}, headers=HEADERS_POST, timeout=10)
    assert r.status_code == 200
    return s


def icon_session(tok):
    s = requests.Session()
    r = s.post(f"{API}/github/icon-session", json={"access_token": tok}, headers=HEADERS_POST, timeout=10)
    return s, r


def b64(t):
    return base64.b64encode(t.encode("utf-8")).decode()


def open_icon_pr_bio(s, title_suffix=""):
    """Create a chelly branch, bio edit PR; returns pr number."""
    br = f"icon/11/edit-{title_suffix or 'bio'}"
    s.post(f"{API}/github/repo/git/refs",
           json={"ref": f"refs/heads/{br}", "sha": "x"}, headers=HEADERS_POST, timeout=10)
    r = s.get(f"{API}/github/repo/contents/content/icons.html", params={"ref": br}, timeout=10)
    j = r.json()
    text = base64.b64decode(j["content"]).decode()
    new = re.sub(r'(data-artist-id="11"[^>]*data-bio=")[^"]*(")',
                 r'\1MARKER_' + (title_suffix or "x") + r'\2', text, count=1)
    s.put(f"{API}/github/repo/contents/content/icons.html",
          json={"message": "bio", "branch": br, "content": b64(new), "sha": j["sha"]},
          headers=HEADERS_POST, timeout=10)
    pr = s.post(f"{API}/github/repo/pulls",
                json={"title": f"edit bio {title_suffix}", "head": br, "base": "main"},
                headers=HEADERS_POST, timeout=10)
    assert pr.status_code == 200, pr.text
    return pr.json()["number"]


class TestIconUpdates:
    def test_bad_token_401(self):
        reset()
        r = requests.post(f"{API}/github/icon-updates",
                          json={"access_token": "nope", "since": 0},
                          headers=HEADERS_POST, timeout=10)
        assert r.status_code == 401
        assert r.json().get("code") == "icon_signin"

    def test_unverified_not_approved_returns_empty(self):
        reset()
        r = requests.post(f"{API}/github/icon-updates",
                          json={"access_token": "mock-fan", "since": 0},
                          headers=HEADERS_POST, timeout=10)
        assert r.status_code == 200
        assert r.json().get("updates") == []

    def test_approve_and_reject_reflected_for_own_icon(self):
        reset()
        sc, _ = icon_session("mock-chelly")
        n1 = open_icon_pr_bio(sc, "a")
        n2 = open_icon_pr_bio(sc, "b")
        a = admin_session()
        # approve n1
        r1 = a.put(f"{API}/github/repo/pulls/{n1}/merge", json={}, headers=HEADERS_POST, timeout=10)
        assert r1.status_code == 200
        # reject n2 with note
        note = "Please tighten it."
        body_md = f"**Not approved:** {note}\n<!-- mad-reject -->"
        r2 = a.patch(f"{API}/github/repo/pulls/{n2}",
                     json={"state": "closed", "body": body_md}, headers=HEADERS_POST, timeout=10)
        assert r2.status_code == 200
        # icon-updates since 0
        up = requests.post(f"{API}/github/icon-updates",
                           json={"access_token": "mock-chelly", "since": 0},
                           headers=HEADERS_POST, timeout=10)
        assert up.status_code == 200
        data = up.json()
        assert data.get("name") == "Chelly Banqz"
        updates = data["updates"]
        # Should include both PRs
        by_num = {u["number"]: u for u in updates}
        assert n1 in by_num and n2 in by_num
        assert by_num[n1]["result"] == "approved"
        assert by_num[n1]["note"] == ""
        assert by_num[n2]["result"] == "rejected"
        assert by_num[n2]["note"] == note
        # Each has "at" > 0 and title stripped of "prefix:"
        for u in updates:
            assert isinstance(u["at"], int) and u["at"] > 0
            assert "edit bio" in u["title"]
        # Since > now returns nothing new
        future = max(u["at"] for u in updates) + 1
        up2 = requests.post(f"{API}/github/icon-updates",
                            json={"access_token": "mock-chelly", "since": future},
                            headers=HEADERS_POST, timeout=10)
        assert up2.status_code == 200
        assert up2.json()["updates"] == []
