"""Icon-account scope + admin review flow tests against the mocked GH proxy.

Covers the server-scope block from the review request:
- POST /api/github/icon-session (verified vs unverified)
- Icon PUT scope (base main, scope leak to another artist, ICON_FILES, branch prefix)
- POST /api/github/repo/git/refs with non-icon branch -> 403
- PUT /api/github/repo/pulls/<n>/merge from icon -> 403
- GET /api/github/activity and /api/github/icon-admin from icon -> 403
- GET /api/github/repo/pulls returns only own icon PRs
- Admin approve (merge) updates main; reject (patch state=closed with body) persists note
- Access requests: unverified icon-session -> 403 icon_unverified; icon-request stored;
  admin approve grants icon session; revoke invalidates session; decline removes request
"""
import base64
import os
import re

import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
ORIGIN = BASE_URL  # Needed for non-GET requests (same-origin check)
HEADERS_POST = {"Content-Type": "application/json", "Origin": ORIGIN}


def reset():
    r = requests.post(f"{API}/mockgh/reset", headers=HEADERS_POST, timeout=10)
    assert r.status_code == 200, r.text


def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/github/session", json={"passcode": os.environ.get("MAD_PASSCODE", "TreeshMAD-test-2026")},
               headers=HEADERS_POST, timeout=10)
    assert r.status_code == 200, r.text
    return s


def icon_session(access_token):
    s = requests.Session()
    r = s.post(f"{API}/github/icon-session", json={"access_token": access_token},
               headers=HEADERS_POST, timeout=10)
    return s, r


def b64(text):
    return base64.b64encode(text.encode("utf-8")).decode()


def get_file(sess, path, ref="main"):
    r = sess.get(f"{API}/github/repo/contents/{path}", params={"ref": ref}, timeout=10)
    assert r.status_code == 200, r.text
    j = r.json()
    return base64.b64decode(j["content"]).decode("utf-8"), j["sha"]


# ---------------- icon-session ----------------

class TestIconSession:
    def test_verified_icon_signs_in(self):
        reset()
        s, r = icon_session("mock-chelly")
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["signedIn"] is True
        assert j["role"] == "icon"
        assert j["artistId"] == "11"
        assert j["login"] == "Chelly Banqz"
        # /github/session echoes same
        r2 = s.get(f"{API}/github/session", timeout=10)
        assert r2.status_code == 200
        j2 = r2.json()
        assert j2["signedIn"] is True and j2["role"] == "icon" and j2["artistId"] == "11"

    def test_unverified_icon_gets_403_unverified(self):
        reset()
        _, r = icon_session("mock-fan")
        assert r.status_code == 403
        j = r.json()
        assert j.get("code") == "icon_unverified"
        assert j.get("name") == "Jordan Fan"
        assert j.get("requested") is False

    def test_invalid_token_401(self):
        reset()
        _, r = icon_session("not-a-real-token")
        assert r.status_code == 401
        assert r.json().get("code") == "icon_signin"


# ---------------- icon PUT scope ----------------

class TestIconPutScope:
    def test_icon_put_main_forbidden(self):
        reset()
        s, _ = icon_session("mock-chelly")
        text, sha = get_file(s, "content/icons.html")
        r = s.put(f"{API}/github/repo/contents/content/icons.html",
                  json={"message": "x", "branch": "main", "content": b64(text), "sha": sha},
                  headers=HEADERS_POST, timeout=10)
        assert r.status_code == 403
        assert r.json().get("code") == "icon_scope"

    def test_icon_put_non_icon_file_forbidden(self):
        reset()
        s, _ = icon_session("mock-chelly")
        # Create branch under icon/11/
        br = "icon/11/edit-models"
        rref = s.post(f"{API}/github/repo/git/refs",
                      json={"ref": f"refs/heads/{br}", "sha": "deadbeef"},
                      headers=HEADERS_POST, timeout=10)
        assert rref.status_code in (201, 200), rref.text
        # Try to edit models.html on that branch -> not in ICON_FILES
        text, sha = get_file(s, "content/icons.html")  # just reuse a sha, server will 403 before sha check? It checks file+branch first
        r = s.put(f"{API}/github/repo/contents/content/models.html",
                  json={"message": "x", "branch": br, "content": b64("<x/>"), "sha": sha},
                  headers=HEADERS_POST, timeout=10)
        assert r.status_code == 403
        assert r.json().get("code") == "icon_scope"

    def test_icon_cannot_touch_another_artists_block(self):
        reset()
        s, _ = icon_session("mock-chelly")
        br = "icon/11/edit-savionce"
        rref = s.post(f"{API}/github/repo/git/refs",
                      json={"ref": f"refs/heads/{br}", "sha": "deadbeef"},
                      headers=HEADERS_POST, timeout=10)
        assert rref.status_code in (200, 201), rref.text
        # Modify SAVIONCE (id=3) bio in icons.html on the icon branch
        text, sha = get_file(s, "content/icons.html", ref=br)
        tampered = text.replace(
            'data-artist-id="3" data-name="SAVIONCE"',
            'data-artist-id="3" data-name="SAVIONCE_HACKED"',
            1,
        )
        assert tampered != text  # sanity
        r = s.put(f"{API}/github/repo/contents/content/icons.html",
                  json={"message": "sneaky", "branch": br, "content": b64(tampered), "sha": sha},
                  headers=HEADERS_POST, timeout=10)
        assert r.status_code == 403, r.text
        assert r.json().get("code") == "icon_scope"

    def test_icon_can_edit_own_bio_on_icon_branch(self):
        reset()
        s, _ = icon_session("mock-chelly")
        br = "icon/11/edit-own"
        rref = s.post(f"{API}/github/repo/git/refs",
                      json={"ref": f"refs/heads/{br}", "sha": "deadbeef"},
                      headers=HEADERS_POST, timeout=10)
        assert rref.status_code in (200, 201)
        text, sha = get_file(s, "content/icons.html", ref=br)
        # Replace Chelly's bio with marker
        new_text = re.sub(
            r'(data-artist-id="11"[^>]*data-bio=")[^"]*(")',
            r'\1TEST_NEW_BIO_ZZ\2',
            text,
            count=1,
        )
        assert "TEST_NEW_BIO_ZZ" in new_text
        r = s.put(f"{API}/github/repo/contents/content/icons.html",
                  json={"message": "edit bio", "branch": br, "content": b64(new_text), "sha": sha},
                  headers=HEADERS_POST, timeout=10)
        assert r.status_code == 200, r.text
        # main unchanged
        main_text, _ = get_file(s, "content/icons.html", ref="main")
        assert "TEST_NEW_BIO_ZZ" not in main_text


# ---------------- git/refs and merge/activity/admin from icon ----------------

class TestIconRouteScope:
    def test_icon_cannot_create_non_icon_branch(self):
        reset()
        s, _ = icon_session("mock-chelly")
        r = s.post(f"{API}/github/repo/git/refs",
                   json={"ref": "refs/heads/songcoder/x", "sha": "deadbeef"},
                   headers=HEADERS_POST, timeout=10)
        assert r.status_code == 403
        assert r.json().get("code") == "icon_scope"

    def test_icon_cannot_create_other_icon_branch(self):
        reset()
        s, _ = icon_session("mock-chelly")
        r = s.post(f"{API}/github/repo/git/refs",
                   json={"ref": "refs/heads/icon/3/evil", "sha": "deadbeef"},
                   headers=HEADERS_POST, timeout=10)
        assert r.status_code == 403

    def test_icon_cannot_merge(self):
        reset()
        # Admin creates a PR to merge against
        a = admin_session()
        # Open an icon PR via icon session (so there's a real PR number)
        s, _ = icon_session("mock-chelly")
        br = "icon/11/some-edit"
        s.post(f"{API}/github/repo/git/refs",
               json={"ref": f"refs/heads/{br}", "sha": "x"}, headers=HEADERS_POST, timeout=10)
        pr = s.post(f"{API}/github/repo/pulls",
                    json={"title": "t", "head": br, "base": "main", "body": ""},
                    headers=HEADERS_POST, timeout=10)
        assert pr.status_code == 200, pr.text
        num = pr.json()["number"]
        # Icon tries merge
        r = s.put(f"{API}/github/repo/pulls/{num}/merge", json={}, headers=HEADERS_POST, timeout=10)
        assert r.status_code == 403, r.text
        # Admin merge works
        r2 = a.put(f"{API}/github/repo/pulls/{num}/merge", json={}, headers=HEADERS_POST, timeout=10)
        assert r2.status_code == 200, r2.text

    def test_icon_cannot_read_activity_or_admin(self):
        reset()
        s, _ = icon_session("mock-chelly")
        r1 = s.get(f"{API}/github/activity", timeout=10)
        r2 = s.get(f"{API}/github/icon-admin", timeout=10)
        assert r1.status_code == 403 and r1.json().get("code") == "icon_scope"
        assert r2.status_code == 403 and r2.json().get("code") == "icon_scope"

    def test_icon_pulls_list_scoped_to_own(self):
        reset()
        a = admin_session()
        # Admin creates a songcoder/ PR
        a.post(f"{API}/github/repo/git/refs",
               json={"ref": "refs/heads/songcoder/admin1", "sha": "x"}, headers=HEADERS_POST, timeout=10)
        a.post(f"{API}/github/repo/pulls",
               json={"title": "admin pr", "head": "songcoder/admin1", "base": "main"},
               headers=HEADERS_POST, timeout=10)
        # Icon creates own PR
        s, _ = icon_session("mock-chelly")
        s.post(f"{API}/github/repo/git/refs",
               json={"ref": "refs/heads/icon/11/mine", "sha": "x"}, headers=HEADERS_POST, timeout=10)
        s.post(f"{API}/github/repo/pulls",
               json={"title": "chelly pr", "head": "icon/11/mine", "base": "main"},
               headers=HEADERS_POST, timeout=10)
        r = s.get(f"{API}/github/repo/pulls", params={"state": "all"}, timeout=10)
        assert r.status_code == 200
        prs = r.json()
        assert len(prs) >= 1
        assert all(p["head"]["ref"].startswith("icon/11/") for p in prs)
        # Admin sees both
        ra = a.get(f"{API}/github/repo/pulls", params={"state": "all"}, timeout=10)
        heads = [p["head"]["ref"] for p in ra.json()]
        assert any(h.startswith("songcoder/") for h in heads)
        assert any(h.startswith("icon/11/") for h in heads)


# ---------------- admin approve / reject flow ----------------

class TestAdminReviewFlow:
    def _open_icon_pr_bio(self):
        s, _ = icon_session("mock-chelly")
        br = "icon/11/artist-edit-bio"
        s.post(f"{API}/github/repo/git/refs",
               json={"ref": f"refs/heads/{br}", "sha": "x"}, headers=HEADERS_POST, timeout=10)
        text, sha = get_file(s, "content/icons.html", ref=br)
        new_text = re.sub(
            r'(data-artist-id="11"[^>]*data-bio=")[^"]*(")',
            r'\1APPROVED_BIO_MARKER\2',
            text, count=1)
        pput = s.put(f"{API}/github/repo/contents/content/icons.html",
                     json={"message": "edit bio", "branch": br, "content": b64(new_text), "sha": sha},
                     headers=HEADERS_POST, timeout=10)
        assert pput.status_code == 200, pput.text
        pr = s.post(f"{API}/github/repo/pulls",
                    json={"title": "edit bio", "head": br, "base": "main"},
                    headers=HEADERS_POST, timeout=10)
        assert pr.status_code == 200, pr.text
        return s, pr.json()["number"]

    def test_approve_updates_main(self):
        reset()
        _, num = self._open_icon_pr_bio()
        a = admin_session()
        r = a.put(f"{API}/github/repo/pulls/{num}/merge", json={}, headers=HEADERS_POST, timeout=10)
        assert r.status_code == 200 and r.json().get("merged") is True
        # /mockgh/raw of main contains the marker
        raw = requests.get(f"{API}/mockgh/raw/content/icons.html", params={"branch": "main"}, timeout=10)
        assert raw.status_code == 200
        assert "APPROVED_BIO_MARKER" in raw.text

    def test_reject_with_note_keeps_main_and_stores_note(self):
        reset()
        _, num = self._open_icon_pr_bio()
        a = admin_session()
        note = "Please tighten the bio to 2 sentences."
        body_md = f"**Not approved:** {note}"
        # Close with explanatory body
        r = a.patch(f"{API}/github/repo/pulls/{num}",
                    json={"state": "closed", "body": body_md},
                    headers=HEADERS_POST, timeout=10)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["state"] == "closed"
        assert note in j.get("body", "")
        assert j.get("merged_at") in (None, "")  # not merged
        # Main unchanged
        raw = requests.get(f"{API}/mockgh/raw/content/icons.html", params={"branch": "main"}, timeout=10)
        assert "APPROVED_BIO_MARKER" not in raw.text


# ---------------- access requests ----------------

class TestAccessRequests:
    def test_request_then_approve_grants_icon_session(self):
        reset()
        # Fan requests access as SAVIONCE (#3)
        r = requests.post(f"{API}/github/icon-request",
                          json={"access_token": "mock-fan", "artistId": "3", "note": "Hi, I'm Jordan."},
                          headers=HEADERS_POST, timeout=10)
        assert r.status_code == 200 and r.json().get("ok") is True
        # 2nd attempt at icon-session marks requested=True
        _, r2 = icon_session("mock-fan")
        assert r2.status_code == 403
        assert r2.json().get("requested") is True
        # Admin reads icon-admin
        a = admin_session()
        la = a.get(f"{API}/github/icon-admin", timeout=10)
        assert la.status_code == 200
        reqs = la.json()["requests"]
        assert any(x["uid"] == "u-fan" and x["artistId"] == "3" for x in reqs)
        # Admin approves
        ap = a.post(f"{API}/github/icon-admin",
                    json={"uid": "u-fan", "action": "approve", "artistId": "3"},
                    headers=HEADERS_POST, timeout=10)
        assert ap.status_code == 200 and ap.json().get("ok") is True
        # Fan can now sign in as icon for SAVIONCE
        sfan, sr = icon_session("mock-fan")
        assert sr.status_code == 200, sr.text
        assert sr.json()["artistId"] == "3" and sr.json()["role"] == "icon"
        return sfan

    def test_decline_removes_request(self):
        reset()
        requests.post(f"{API}/github/icon-request",
                      json={"access_token": "mock-fan", "artistId": "3", "note": "pls"},
                      headers=HEADERS_POST, timeout=10)
        a = admin_session()
        # Decline = plain post without approve/revoke still removes it (code does pop at end)
        r = a.post(f"{API}/github/icon-admin",
                   json={"uid": "u-fan", "action": "decline"},
                   headers=HEADERS_POST, timeout=10)
        assert r.status_code == 200
        la = a.get(f"{API}/github/icon-admin", timeout=10).json()
        assert not any(x["uid"] == "u-fan" for x in la["requests"])
        assert not any(x.get("uid") == "u-fan" for x in la["approved"])

    def test_revoke_invalidates_fan_session(self):
        reset()
        # Fan request -> admin approve -> fan signs in
        requests.post(f"{API}/github/icon-request",
                      json={"access_token": "mock-fan", "artistId": "3"},
                      headers=HEADERS_POST, timeout=10)
        a = admin_session()
        a.post(f"{API}/github/icon-admin",
               json={"uid": "u-fan", "action": "approve", "artistId": "3"},
               headers=HEADERS_POST, timeout=10)
        sfan, sr = icon_session("mock-fan")
        assert sr.status_code == 200
        # Admin revokes
        rv = a.post(f"{API}/github/icon-admin",
                    json={"uid": "u-fan", "action": "revoke"},
                    headers=HEADERS_POST, timeout=10)
        assert rv.status_code == 200
        # Fan's existing session is now invalidated on next check
        sess = sfan.get(f"{API}/github/session", timeout=10).json()
        assert sess["signedIn"] is False
