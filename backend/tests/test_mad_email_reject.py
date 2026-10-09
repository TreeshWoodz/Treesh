"""Iteration 20: email alerts (mocked Resend) + reject-reason PR body round-trip.

Covers:
- POST /mockgh/reset clears emails[]
- Icon opens a PR -> emails[] gets kind 'icon-change'
- Admin opens a PR -> no email added
- POST /github/icon-request fresh -> email 'icon-access'; repeat -> no 2nd email
- GET /github/session: admin has masked email, icon has email=null
- POST /github/alert-test admin -> emails[] 'test'; icon -> 403
- Reject PR with chip + extra note -> body ends with the expected note sentence
- Icon /icon-updates returns note from a rejected PR
"""
import base64
import os

import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
ORIGIN = BASE_URL
H = {"Content-Type": "application/json", "Origin": ORIGIN}
PASSCODE = os.environ.get("MAD_PASSCODE", "TreeshMAD-test-2026")
ALERT_TO = "savionce@proton.me"


def reset():
    r = requests.post(f"{API}/mockgh/reset", headers=H, timeout=10)
    assert r.status_code == 200, r.text


def state():
    return requests.get(f"{API}/mockgh/state", timeout=10).json()


def admin():
    s = requests.Session()
    r = s.post(f"{API}/github/session", json={"passcode": PASSCODE}, headers=H, timeout=10)
    assert r.status_code == 200, r.text
    return s


def icon(tok="mock-chelly"):
    s = requests.Session()
    r = s.post(f"{API}/github/icon-session", json={"access_token": tok}, headers=H, timeout=10)
    return s, r


def icon_pr(sess, artist_id=11, branch_suffix="t1", title="Chelly Banqz: Update artist: Chelly Banqz"):
    # fetch main sha
    r = sess.get(f"{API}/github/repo/git/ref/heads/main", timeout=10)
    assert r.status_code == 200, r.text
    sha = r.json()["object"]["sha"]
    br = f"icon/{artist_id}/{branch_suffix}"
    r = sess.post(f"{API}/github/repo/git/refs",
                  json={"ref": f"refs/heads/{br}", "sha": sha}, headers=H, timeout=10)
    assert r.status_code in (200, 201), r.text
    r = sess.post(f"{API}/github/repo/pulls",
                  json={"title": title, "head": br, "base": "main", "body": ""}, headers=H, timeout=10)
    assert r.status_code in (200, 201), r.text
    return r.json()


class TestReset:
    def test_reset_clears_emails(self):
        reset()
        # cause an email
        s, r = icon("mock-fan")
        assert r.status_code == 403
        requests.post(f"{API}/github/icon-request",
                      json={"access_token": "mock-fan", "artistId": "3", "note": "hi"}, headers=H, timeout=10)
        assert len(state()["emails"]) >= 1
        reset()
        assert state()["emails"] == []


class TestEmailOnIconChange:
    def test_icon_pr_adds_email(self):
        reset()
        s, r = icon("mock-chelly")
        assert r.status_code == 200
        pr = icon_pr(s)
        emails = state()["emails"]
        assert len(emails) == 1
        e = emails[0]
        assert e["kind"] == "icon-change"
        assert e["to"] == ALERT_TO
        assert e["subject"] == "Chelly Banqz sent a change for review"
        lines = dict(e["lines"])
        assert lines["Icon"] == "Chelly Banqz (#11)"
        assert lines["Change"] == "Update artist: Chelly Banqz"
        assert lines["Request"] == f"#{pr['number']}"

    def test_admin_pr_no_email(self):
        reset()
        a = admin()
        # admin opens a songcoder/ branch + PR
        r = a.get(f"{API}/github/repo/git/ref/heads/main", timeout=10)
        sha = r.json()["object"]["sha"]
        br = "songcoder/admin-feat"
        r = a.post(f"{API}/github/repo/git/refs",
                   json={"ref": f"refs/heads/{br}", "sha": sha}, headers=H, timeout=10)
        assert r.status_code in (200, 201)
        r = a.post(f"{API}/github/repo/pulls",
                   json={"title": "Admin: Update", "head": br, "base": "main"}, headers=H, timeout=10)
        assert r.status_code in (200, 201)
        assert state()["emails"] == []


class TestEmailOnAccessRequest:
    def test_fresh_request_adds_email_repeat_does_not(self):
        reset()
        s, r = icon("mock-fan")
        assert r.status_code == 403
        r1 = requests.post(f"{API}/github/icon-request",
                           json={"access_token": "mock-fan", "artistId": "3", "note": "hi"},
                           headers=H, timeout=10)
        assert r1.status_code == 200
        emails = state()["emails"]
        assert len(emails) == 1
        e = emails[0]
        assert e["kind"] == "icon-access"
        assert e["subject"] == "Jordan Fan asked for Icon access"
        lines = dict(e["lines"])
        assert lines["Name"] == "Jordan Fan"
        assert lines["Email"] == "jordan@example.com"
        assert lines["Says they are"] == "Icon #3"
        assert lines["Note"] == "hi"
        # Repeat -> still 1 email
        r2 = requests.post(f"{API}/github/icon-request",
                           json={"access_token": "mock-fan", "artistId": "3", "note": "hi again"},
                           headers=H, timeout=10)
        assert r2.status_code == 200
        assert len(state()["emails"]) == 1


class TestSessionEmailField:
    def test_admin_session_has_masked_email(self):
        reset()
        a = admin()
        r = a.get(f"{API}/github/session", timeout=10)
        j = r.json()
        assert j["signedIn"] is True
        assert j["role"] == "admin"
        assert j["email"] == "s•••@proton.me"

    def test_icon_session_email_null(self):
        reset()
        s, r = icon("mock-chelly")
        assert r.status_code == 200
        j = s.get(f"{API}/github/session", timeout=10).json()
        assert j["signedIn"] is True
        assert j["role"] == "icon"
        assert j.get("email") is None

    def test_signed_out_email_null(self):
        reset()
        j = requests.get(f"{API}/github/session", timeout=10).json()
        assert j["signedIn"] is False
        assert j.get("email") is None


class TestAlertTest:
    def test_admin_can_send_test(self):
        reset()
        a = admin()
        r = a.post(f"{API}/github/alert-test", headers=H, timeout=10)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["ok"] is True
        assert j["to"] == "s•••@proton.me"
        emails = state()["emails"]
        assert any(e["kind"] == "test" for e in emails)

    def test_icon_forbidden(self):
        reset()
        s, _ = icon("mock-chelly")
        r = s.post(f"{API}/github/alert-test", headers=H, timeout=10)
        assert r.status_code == 403

    def test_signed_out_forbidden(self):
        reset()
        r = requests.post(f"{API}/github/alert-test", headers=H, timeout=10)
        assert r.status_code in (401, 403)


class TestRejectBodyRoundTrip:
    def test_reject_with_chips_and_extra_note(self):
        reset()
        s, _ = icon("mock-chelly")
        pr = icon_pr(s)
        a = admin()
        # Simulate the UI composed body: 2 chips joined by ' · ' + '. ' + extra
        note = "Blurry or low-quality photo · Missing credits. Resend when ready."
        new_body = f"\n\n---\n**Not approved:** {note}\n<!-- mad-reject -->"
        r = a.patch(f"{API}/github/repo/pulls/{pr['number']}",
                    json={"state": "closed", "body": new_body}, headers=H, timeout=10)
        assert r.status_code == 200, r.text
        got = r.json()
        assert got["state"] == "closed"
        assert got["merged_at"] in (None, "")
        assert got["body"].endswith(f"**Not approved:** {note}\n<!-- mad-reject -->")

    def test_icon_updates_returns_note(self):
        """Regression: icon sees the combined note under My changes."""
        reset()
        s, _ = icon("mock-chelly")
        pr = icon_pr(s)
        a = admin()
        note = "Blurry or low-quality photo · Missing credits. Resend when ready."
        body = f"\n\n---\n**Not approved:** {note}\n<!-- mad-reject -->"
        r = a.patch(f"{API}/github/repo/pulls/{pr['number']}",
                    json={"state": "closed", "body": body}, headers=H, timeout=10)
        assert r.status_code == 200
        upd = requests.post(f"{API}/github/icon-updates",
                            json={"access_token": "mock-chelly", "since": 0}, headers=H, timeout=10).json()
        assert upd["name"] == "Chelly Banqz"
        assert len(upd["updates"]) == 1
        u = upd["updates"][0]
        assert u["result"] == "rejected"
        assert u["note"] == note
        assert u["title"] == "Update artist: Chelly Banqz"
