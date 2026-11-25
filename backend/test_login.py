import requests
print(requests.post('http://localhost:8000/api/auth/login', json={'email':'sarabialuis50@gmail.com', 'password':'password123'}).text)