import io
import pytest
from fastapi.testclient import TestClient


def register_user(client: TestClient, email: str, password: str = "StrongPass123!", full_name: str = "Test User"):
    return client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": full_name},
    )


def login_user(client: TestClient, email: str, password: str = "StrongPass123!"):
    return client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )


def auth_headers(client: TestClient, email: str, password: str = "StrongPass123!"):
    res = login_user(client, email, password)
    data = res.json()
    return {"Authorization": f"Bearer {data['access_token']}"}


def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_auth_flows(client: TestClient):
    # 1. Register User A
    res = register_user(client, "alice@example.com", "Password123!", "Alice Smith")
    assert res.status_code == 201
    user_data = res.json()
    assert user_data["email"] == "alice@example.com"
    assert "id" in user_data

    # Duplicate registration should fail
    dup = register_user(client, "alice@example.com", "Password123!")
    assert dup.status_code == 400

    # 2. Login User A
    login_res = login_user(client, "alice@example.com", "Password123!")
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    assert "refresh_token" in token_data

    # Wrong password should fail
    wrong = login_user(client, "alice@example.com", "WrongPassword!")
    assert wrong.status_code == 401

    # 3. GET /auth/me
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "alice@example.com"

    # 4. Refresh token
    ref_res = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": token_data["refresh_token"]},
    )
    assert ref_res.status_code == 200
    assert "access_token" in ref_res.json()


def test_credential_vault_crud_and_isolation(client: TestClient):
    # Setup User A and User B
    register_user(client, "user_a@example.com", "Password123!", "User A")
    register_user(client, "user_b@example.com", "Password123!", "User B")
    headers_a = auth_headers(client, "user_a@example.com", "Password123!")
    headers_b = auth_headers(client, "user_b@example.com", "Password123!")

    # 1. User A creates a credential
    cred_payload = {
        "title": "SBI Credentials",
        "category": "Banking",
        "username": "sbi_alice",
        "website_url": "https://retail.onlinesbi.sbi",
        "encrypted_data": "encrypted_blob_sample_abc123",
        "encryption_iv": "iv_sample_12_bytes",
        "key_derivation_salt": "salt_sample_16_bytes",
    }
    create_res = client.post("/api/v1/credentials", json=cred_payload, headers=headers_a)
    assert create_res.status_code == 201
    created_cred = create_res.json()
    cred_id = created_cred["id"]
    assert created_cred["title"] == "SBI Credentials"
    assert created_cred["encrypted_data"] == "encrypted_blob_sample_abc123"

    # 2. List credentials for User A: MUST NOT include encrypted_data
    list_res_a = client.get("/api/v1/credentials", headers=headers_a)
    assert list_res_a.status_code == 200
    list_data_a = list_res_a.json()
    assert len(list_data_a) == 1
    assert "encrypted_data" not in list_data_a[0]
    assert list_data_a[0]["title"] == "SBI Credentials"

    # 3. User B list credentials: MUST be empty
    list_res_b = client.get("/api/v1/credentials", headers=headers_b)
    assert list_res_b.status_code == 200
    assert len(list_res_b.json()) == 0

    # 4. Cross-user isolation: User B attempts to access User A's credential by ID
    iso_get = client.get(f"/api/v1/credentials/{cred_id}", headers=headers_b)
    assert iso_get.status_code == 404

    # 5. User A retrieves item by ID: includes encrypted payload
    detail_res = client.get(f"/api/v1/credentials/{cred_id}", headers=headers_a)
    assert detail_res.status_code == 200
    assert detail_res.json()["encrypted_data"] == "encrypted_blob_sample_abc123"

    # 6. Update credential
    update_res = client.put(
        f"/api/v1/credentials/{cred_id}",
        json={"title": "SBI Credentials Updated", "category": "Finance"},
        headers=headers_a,
    )
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "SBI Credentials Updated"
    assert update_res.json()["category"] == "Finance"

    # 7. Delete credential
    del_res = client.delete(f"/api/v1/credentials/{cred_id}", headers=headers_a)
    assert del_res.status_code == 204

    # Verify deleted
    get_after = client.get(f"/api/v1/credentials/{cred_id}", headers=headers_a)
    assert get_after.status_code == 404


def test_file_manager_crud_and_download(client: TestClient):
    register_user(client, "files_user@example.com", "Password123!", "File User")
    headers = auth_headers(client, "files_user@example.com", "Password123!")

    # 1. Upload file
    file_content = b"Confidential security report content"
    files = {"file": ("report.txt", io.BytesIO(file_content), "text/plain")}
    up_res = client.post("/api/v1/files/upload", files=files, headers=headers)
    assert up_res.status_code == 201
    file_data = up_res.json()
    file_id = file_data["id"]
    assert file_data["filename"] == "report.txt"
    assert file_data["file_size"] == len(file_content)

    # 2. List files
    list_res = client.get("/api/v1/files", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 3. Download file
    down_res = client.get(f"/api/v1/files/{file_id}/download", headers=headers)
    assert down_res.status_code == 200
    assert down_res.content == file_content

    # 4. Delete file
    del_res = client.delete(f"/api/v1/files/{file_id}", headers=headers)
    assert del_res.status_code == 204

    # Verify deleted
    down_del = client.get(f"/api/v1/files/{file_id}/download", headers=headers)
    assert down_del.status_code == 404


def test_calendar_and_dashboard_stats(client: TestClient):
    register_user(client, "ops_user@example.com", "Password123!", "Ops User")
    headers = auth_headers(client, "ops_user@example.com", "Password123!")

    # 1. Create calendar event
    event_payload = {
        "title": "Quarterly Security Audit",
        "description": "Routine audit of vault keys",
        "start_time": "2026-10-15T14:00:00Z",
        "end_time": "2026-10-15T16:00:00Z",
        "location": "Virtual Room A / Zoom",
        "event_type": "audit",
    }
    create_res = client.post("/api/v1/calendar/events", json=event_payload, headers=headers)
    assert create_res.status_code == 201
    event_id = create_res.json()["id"]

    # 2. List events
    events_res = client.get("/api/v1/calendar/events", headers=headers)
    assert events_res.status_code == 200
    assert len(events_res.json()) == 1

    # 3. Dashboard stats
    stats_res = client.get("/api/v1/dashboard/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["event_count"] == 1
    assert "security_score" in stats
    assert len(stats["recent_activities"]) >= 1

    # 4. Delete event
    del_res = client.delete(f"/api/v1/calendar/events/{event_id}", headers=headers)
    assert del_res.status_code == 204
