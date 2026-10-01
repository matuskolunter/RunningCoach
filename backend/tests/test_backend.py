"""Backend regression tests for RunningCoach - admin training edit/delete + permanentka adjust."""
import os
import time
import pytest
import requests

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/') if os.environ.get('REACT_APP_BACKEND_URL') else None
if not BASE_URL:
    # fallback: read from frontend/.env
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                BASE_URL = line.split('=', 1)[1].strip().strip('"').rstrip('/')

ADMIN_EMAIL = "matusko.lunter@gmail.com"
ADMIN_NAME = "Matús"
RUNNER_EMAIL = f"test_runner_{int(time.time())}@example.com"
RUNNER_NAME = "Test Runner"


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def created_training(api):
    payload = {
        "title": "TEST_training_e2e",
        "date": "2030-01-15T18:00:00Z",
        "location": "TestPark",
        "distance_km": 5.0,
        "capacity": 10,
        "description": "test",
        "pace": "5:30",
        "organizer_name": ADMIN_NAME,
        "organizer_email": ADMIN_EMAIL,
        "use_permanentka": True,
    }
    r = api.post(f"{BASE_URL}/api/trainings", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    yield data
    # cleanup
    api.delete(f"{BASE_URL}/api/trainings/{data['id']}?admin_email={ADMIN_EMAIL}")


def test_config_admin_emails(api):
    r = api.get(f"{BASE_URL}/api/config")
    assert r.status_code == 200
    assert ADMIN_EMAIL in r.json()["admin_emails"]


def test_create_training_requires_admin(api):
    payload = {
        "title": "nope",
        "date": "2030-01-15T18:00:00Z",
        "location": "x",
        "distance_km": 1,
        "capacity": 1,
        "organizer_email": "peter@example.com",
    }
    r = api.post(f"{BASE_URL}/api/trainings", json=payload)
    assert r.status_code == 403


def test_create_training_as_admin(created_training):
    assert created_training["title"] == "TEST_training_e2e"
    assert created_training["location"] == "TestPark"
    assert "id" in created_training


def test_update_training_as_admin(api, created_training):
    tid = created_training["id"]
    body = {
        "admin_email": ADMIN_EMAIL,
        "title": "TEST_training_updated",
        "date": "2030-01-16T19:00:00Z",
        "location": "NewPark",
        "distance_km": 7.5,
        "capacity": 15,
        "description": "upd",
        "pace": "5:00",
        "use_permanentka": True,
    }
    r = api.put(f"{BASE_URL}/api/trainings/{tid}", json=body)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["title"] == "TEST_training_updated"
    assert data["location"] == "NewPark"
    assert data["distance_km"] == 7.5
    # verify persistence
    r2 = api.get(f"{BASE_URL}/api/trainings/{tid}")
    assert r2.json()["title"] == "TEST_training_updated"


def test_update_training_rejects_non_admin(api, created_training):
    body = {
        "admin_email": "peter@example.com",
        "title": "x", "date": "2030-01-16T19:00:00Z", "location": "x",
        "distance_km": 1, "capacity": 1, "use_permanentka": True,
    }
    r = api.put(f"{BASE_URL}/api/trainings/{created_training['id']}", json=body)
    assert r.status_code == 403


def test_delete_training_rejects_non_admin(api, created_training):
    r = api.delete(f"{BASE_URL}/api/trainings/{created_training['id']}?admin_email=peter@example.com")
    assert r.status_code == 403


def test_permanentka_adjust_requires_admin(api):
    body = {"admin_email": "peter@example.com", "email": RUNNER_EMAIL, "amount": 3}
    r = api.post(f"{BASE_URL}/api/admin/permanentka-adjust", json=body)
    assert r.status_code == 403


def test_permanentka_adjust_and_dashboard(api):
    # create runner
    r = api.post(f"{BASE_URL}/api/users", json={"name": RUNNER_NAME, "email": RUNNER_EMAIL})
    assert r.status_code == 200
    # adjust +4
    body = {"admin_email": ADMIN_EMAIL, "email": RUNNER_EMAIL, "amount": 4}
    r = api.post(f"{BASE_URL}/api/admin/permanentka-adjust", json=body)
    assert r.status_code == 200
    # dashboard shows 4
    r = api.get(f"{BASE_URL}/api/users/{RUNNER_EMAIL}/dashboard")
    assert r.status_code == 200
    assert r.json()["permanentka_count"] == 4


def test_permanentka_reset_rejects_non_admin(api):
    body = {"admin_email": "peter@example.com", "email": RUNNER_EMAIL}
    r = api.post(f"{BASE_URL}/api/admin/reset-permanentka", json=body)
    assert r.status_code == 403


def test_permanentka_reset_zeroes(api):
    body = {"admin_email": ADMIN_EMAIL, "email": RUNNER_EMAIL}
    r = api.post(f"{BASE_URL}/api/admin/reset-permanentka", json=body)
    assert r.status_code == 200
    r = api.get(f"{BASE_URL}/api/users/{RUNNER_EMAIL}/dashboard")
    assert r.json()["permanentka_count"] == 0


def test_admin_report(api):
    r = api.get(f"{BASE_URL}/api/admin/report?admin_email={ADMIN_EMAIL}")
    assert r.status_code == 200
    data = r.json()
    assert "trainings" in data and "runners" in data


def test_admin_report_rejects_non_admin(api):
    r = api.get(f"{BASE_URL}/api/admin/report?admin_email=peter@example.com")
    assert r.status_code == 403


def test_delete_training_as_admin_last(api):
    # create a training then delete it
    payload = {
        "title": "TEST_delete_me",
        "date": "2030-02-01T18:00:00Z",
        "location": "x", "distance_km": 1, "capacity": 1,
        "organizer_email": ADMIN_EMAIL, "organizer_name": ADMIN_NAME,
    }
    r = api.post(f"{BASE_URL}/api/trainings", json=payload)
    tid = r.json()["id"]
    r = api.delete(f"{BASE_URL}/api/trainings/{tid}?admin_email={ADMIN_EMAIL}")
    assert r.status_code == 200
    assert r.json()["deleted"] is True
    r = api.get(f"{BASE_URL}/api/trainings/{tid}")
    assert r.status_code == 404
