"""Test the /marketing/ai-suggestion endpoint directly via HTTP to our running server."""
import requests
import json

# First login to get a token
login_res = requests.post("http://localhost:8000/api/auth/login", json={
    "email": "luis@menuia.co",
    "password": "Menu.IA2025*"
})
print(f"Login status: {login_res.status_code}")
if login_res.status_code != 200:
    # Try another password
    login_res = requests.post("http://localhost:8000/api/auth/login", json={
        "email": "luis@menuia.co",
        "password": "123456"
    })
    print(f"Login retry status: {login_res.status_code}")

if login_res.status_code == 200:
    token = login_res.json().get("access_token")
    print(f"Token: {token[:20]}...")
    
    # Now call the marketing endpoint
    res = requests.post("http://localhost:8000/api/marketing/ai-suggestion", 
        json={
            "segment_id": "all",
            "segment_name": "Todos los clientes",
            "segment_desc": "Todos los clientes registrados",
            "tone": "amigable y persuasivo"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"\nAI Suggestion status: {res.status_code}")
    print(f"Response: {json.dumps(res.json(), indent=2, ensure_ascii=False)}")
else:
    print(f"Login failed: {login_res.text}")
