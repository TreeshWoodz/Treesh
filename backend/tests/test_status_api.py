"""Core API smoke and persistence tests for status endpoints."""

import os
import time
import uuid

import pytest
import requests


def _base_url() -> str:
    base = os.environ.get("EXPO_BACKEND_URL") or os.environ.get("EXPO_PUBLIC_BACKEND_URL")
    if not base:
        pytest.skip("EXPO_BACKEND_URL/EXPO_PUBLIC_BACKEND_URL not set")
    return base.rstrip("/")


@pytest.fixture
def api_client():
    """Shared requests session for API tests."""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def test_api_root_works(api_client):
    """Health/root route should be reachable via /api prefix."""
    response = api_client.get(f"{_base_url()}/api/")
    assert response.status_code == 200
    payload = response.json()
    assert payload == {"message": "Hello World"}


def test_create_status_and_verify_in_list(api_client):
    """Create status and validate persistence through list endpoint."""
    marker = f"TEST_Vocotap_{int(time.time())}_{uuid.uuid4().hex[:6]}"
    create_response = api_client.post(
        f"{_base_url()}/api/status",
        json={"client_name": marker},
    )
    assert create_response.status_code == 200
    created = create_response.json()
    assert created["client_name"] == marker
    assert isinstance(created["id"], str) and created["id"]

    list_response = api_client.get(f"{_base_url()}/api/status")
    assert list_response.status_code == 200
    records = list_response.json()
    matched = [item for item in records if item.get("id") == created["id"]]
    assert len(matched) == 1
    assert matched[0]["client_name"] == marker


def test_create_status_validation_error(api_client):
    """Validation should reject missing required fields."""
    response = api_client.post(f"{_base_url()}/api/status", json={})
    assert response.status_code == 422
    payload = response.json()
    assert payload.get("detail")
