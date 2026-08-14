import sys
import os
import json

sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

response = client.get("/api/v1/resources?page=1&limit=20")
data = response.json()

print(f"Status: {response.status_code}")
print(f"Total in Meta: {data.get('meta', {}).get('total_items')}")
print(f"Items in Data: {len(data.get('data', []))}")
if data.get('data'):
    print(f"First item title: {data['data'][0].get('title')}")
