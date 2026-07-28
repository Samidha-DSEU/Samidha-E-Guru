def test_health_check_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert json_data["message"] == "SAMIDHA E-GURU API is running."
    assert json_data["data"]["status"] == "healthy"


def test_google_login_endpoint(client):
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
