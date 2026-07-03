import requests
import json

base_url = "http://localhost:8000/api/v1"

# Login
login_data = {
    "email": "test@test.com",
    "password": "test123"
}
res = requests.post(f"{base_url}/auth/login", json=login_data)
print("Login status:", res.status_code)

if res.status_code == 200:
    token = res.json()["access_token"]
    print("Got token:", token)
    
    # GET dashboard
    headers = {"Authorization": f"Bearer {token}"}
    dash_res = requests.get(f"{base_url}/analytics/dashboard", headers=headers)
    print("Dashboard status:", dash_res.status_code)
    try:
        print("Dashboard response:", dash_res.json())
    except Exception as e:
        print("Dashboard text:", dash_res.text)
else:
    print("Login text:", res.text)
