import requests
import json

BASE = "http://127.0.0.1:5000/api"

# Test register
r = requests.post(f"{BASE}/auth/register", json={"email": "test@test.com", "password": "test123", "role": "Client"})
print("Register:", r.status_code, r.json())

# Test login
r = requests.post(f"{BASE}/auth/login", json={"email": "test@test.com", "password": "test123"})
print("Login:", r.status_code, r.json())
token = r.json().get("access_token")
print("Token:", token[:30] + "..." if token else "NONE")
