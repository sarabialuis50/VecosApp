import requests

# Test backend on Railway
BACKEND = "https://menuia-production.up.railway.app"

print("=== Test 1: GET business ===")
r = requests.get(f"{BACKEND}/api/business/don-jediondo", timeout=10)
print(f"Status: {r.status_code}")
print(f"Content-Type: {r.headers.get('content-type')}")
if 'json' in r.headers.get('content-type', ''):
    print(f"Data: {r.json().get('nombre', 'N/A')}")
else:
    print(f"Response: {r.text[:100]}")

print("\n=== Test 2: POST employee login ===")
r = requests.post(f"{BACKEND}/api/employee/login/don-jediondo", json={"pin": "5730"}, timeout=10)
print(f"Status: {r.status_code}")
print(f"Content-Type: {r.headers.get('content-type')}")
if 'json' in r.headers.get('content-type', ''):
    data = r.json()
    if 'employee' in data:
        print(f"Employee: {data['employee'].get('nombre')}")
    elif 'detail' in data:
        print(f"Error: {data['detail']}")
else:
    print(f"Response: {r.text[:200]}")
