from unittest.mock import patch

def test_health_check_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert json_data["message"] == "SAMIDHA E-GURU Backend Service is healthy"
    assert json_data["data"]["status"] == "healthy"


@patch("google.oauth2.id_token.verify_oauth2_token")
def test_google_login_endpoint(mock_verify, client):
    mock_verify.return_value = {
        "email": "test.student@samidha.org",
        "name": "Test Student",
        "picture": "https://example.com/avatar.png"
    }
    payload = {
        "id_token": "mock_google_id_token_12345",
        "role_name": "student"
    }
    response = client.post("/api/v1/auth/google", json=payload)
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "access_token" in json_data["data"]
    assert "refresh_token" in json_data["data"]
