import requests
try:
    r = requests.post('http://localhost:8000/api/auth/login', json={'email':'sarabialuis50@gmail.com', 'password':'password123'})
    print(r.status_code, r.text)
except Exception as e:
    print(e)