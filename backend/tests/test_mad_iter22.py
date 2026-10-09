"""Iteration 22 — Weekly Link Check, Icon audio uploads (signed), Catalog scan + email report, Icons merge."""
import os
import hashlib
import time
import io
import re
import pytest
import requests

def _read_env():
    for p in ("/app/frontend/.env",):
        try:
            for line in open(p):
                if line.startswith("REACT_APP_BACKEND_URL="):
                    return line.split("=", 1)[1].strip()
        except Exception:
            pass
    return os.environ.get("REACT_APP_BACKEND_URL", "")


BASE = (os.environ.get("REACT_APP_BACKEND_URL") or _read_env()).rstrip("/")
assert BASE, "REACT_APP_BACKEND_URL not set"
ORIGIN = BASE  # same origin
PASSCODE = "TreeshMAD-test-2026"


def _h():
    return {"Origin": ORIGIN, "Referer": BASE + "/songcoder.html"}


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE}/api/mockgh/reset", headers=_h(), timeout=20)
    assert r.status_code == 200, r.text
    r = s.post(f"{BASE}/api/github/session", json={"passcode": PASSCODE}, headers=_h(), timeout=20)
    assert r.status_code == 200, r.text
    return s


@pytest.fixture(scope="module")
def icon_session():
    s = requests.Session()
    r = s.post(f"{BASE}/api/github/icon-session", json={"access_token": "mock-chelly"}, headers=_h(), timeout=20)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j.get("role") == "icon"
    assert str(j.get("artistId")) == "11"
    return s


# ---------- Cloudinary signed uploads ----------
class TestCloudinarySign:
    def test_sign_requires_auth(self):
        r = requests.get(f"{BASE}/api/github/cloudinary-sign", headers=_h(), timeout=20)
        assert r.status_code == 401

    def test_admin_sign_folder(self, admin_session):
        r = admin_session.get(f"{BASE}/api/github/cloudinary-sign", headers=_h(), timeout=20)
        assert r.status_code == 200
        j = r.json()
        assert j["cloudName"] == "treesh"
        assert j["apiKey"] == "mock_key"
        assert j["folder"] == "treesh/music"
        assert isinstance(j["timestamp"], int)
        # Verify sha1 signature
        expected = hashlib.sha1(f"folder={j['folder']}&timestamp={j['timestamp']}mock_secret".encode()).hexdigest()
        assert j["signature"] == expected
        assert j["maxBytes"] == 100 * 1024 * 1024

    def test_icon_sign_folder_pinned(self, icon_session):
        r = icon_session.get(f"{BASE}/api/github/cloudinary-sign", headers=_h(), timeout=20)
        assert r.status_code == 200
        j = r.json()
        assert j["folder"] == "treesh/music/icons/11"
        expected = hashlib.sha1(f"folder={j['folder']}&timestamp={j['timestamp']}mock_secret".encode()).hexdigest()
        assert j["signature"] == expected

    def test_upload_valid(self, admin_session):
        sg = admin_session.get(f"{BASE}/api/github/cloudinary-sign", headers=_h(), timeout=20).json()
        files = {"file": ("sample.mp3", io.BytesIO(b"ID3\x00abcdef"), "audio/mpeg")}
        data = {"folder": sg["folder"], "timestamp": str(sg["timestamp"]), "signature": sg["signature"], "api_key": "mock_key"}
        r = admin_session.post(f"{BASE}/api/mockgh/cloudinary-upload", data=data, files=files, headers=_h(), timeout=30)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["secure_url"].startswith(f"https://res.cloudinary.com/treesh/video/upload/v1/{sg['folder']}/")

    def test_upload_icon_folder(self, icon_session):
        sg = icon_session.get(f"{BASE}/api/github/cloudinary-sign", headers=_h(), timeout=20).json()
        files = {"file": ("sample.mp3", io.BytesIO(b"ID3\x00abcdef"), "audio/mpeg")}
        data = {"folder": sg["folder"], "timestamp": str(sg["timestamp"]), "signature": sg["signature"], "api_key": "mock_key"}
        r = icon_session.post(f"{BASE}/api/mockgh/cloudinary-upload", data=data, files=files, headers=_h(), timeout=30)
        assert r.status_code == 200
        j = r.json()
        assert "/treesh/music/icons/11/" in j["secure_url"]

    def test_upload_invalid_signature(self, admin_session):
        sg = admin_session.get(f"{BASE}/api/github/cloudinary-sign", headers=_h(), timeout=20).json()
        files = {"file": ("sample.mp3", io.BytesIO(b"ID3\x00abcdef"), "audio/mpeg")}
        data = {"folder": sg["folder"], "timestamp": str(sg["timestamp"]), "signature": "deadbeef", "api_key": "mock_key"}
        r = admin_session.post(f"{BASE}/api/mockgh/cloudinary-upload", data=data, files=files, headers=_h(), timeout=30)
        assert r.status_code == 401
        assert "Invalid Signature" in r.text


# ---------- Link report ----------
class TestLinkReport:
    def test_icon_cannot_email_report(self, icon_session):
        r = icon_session.post(f"{BASE}/api/github/link-report", headers=_h(), timeout=120)
        assert r.status_code == 403

    def test_admin_link_report(self, admin_session):
        # Reset LINK_LAST memory indirectly by just running once first
        r = admin_session.post(f"{BASE}/api/github/link-report", headers=_h(), timeout=180)
        assert r.status_code == 200, r.text
        j = r.json()
        for k in ("total", "checked", "problems", "emailed"):
            assert k in j
        # 56 songs = 112 (audio+cover) + 12 artists photos + banners (variable) → total should be reasonable
        assert j["total"] >= 56 * 2 + 12  # at least 124
        assert isinstance(j["problems"], list)
        for p in j["problems"]:
            for k in ("key", "what", "name", "by", "url", "why", "fresh"):
                assert k in p, p

    def test_rerun_fresh_becomes_false(self, admin_session):
        r1 = admin_session.post(f"{BASE}/api/github/link-report", headers=_h(), timeout=180).json()
        r2 = admin_session.post(f"{BASE}/api/github/link-report", headers=_h(), timeout=180).json()
        # For keys present in both, fresh must be False in r2
        prev_keys = {p["key"] for p in r1["problems"]}
        for p in r2["problems"]:
            if p["key"] in prev_keys:
                assert p["fresh"] is False, p

    def test_email_recorded_in_mock_state(self, admin_session):
        admin_session.post(f"{BASE}/api/github/link-report", headers=_h(), timeout=180)
        r = requests.get(f"{BASE}/api/mockgh/state", headers=_h(), timeout=20)
        assert r.status_code == 200
        emails = r.json().get("emails", [])
        link_emails = [e for e in emails if e.get("kind") == "link-check"]
        assert link_emails, "Expected a link-check email recorded"
        # subject format
        subj = link_emails[-1].get("subject") or link_emails[-1].get("title") or ""
        assert re.search(r"link.*(need|answered)", subj, re.I), subj


# ---------- Session + server status ----------
class TestSession:
    def test_session_version_and_features(self, admin_session):
        r = admin_session.get(f"{BASE}/api/github/session", headers=_h(), timeout=20)
        assert r.status_code == 200
        j = r.json()
        assert j["version"] == "2026-10-10"
        for k in ("email", "imagekit", "icons", "oauth", "audio"):
            assert k in j["features"]
        assert j["features"]["audio"] is True
