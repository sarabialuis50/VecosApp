import requests
import json

URL = "http://localhost:8001/api/whatsapp/webhook"

# Simulamos un mensaje de WhatsApp que llega desde Twilio
test_data = {
    "From": "whatsapp:+573017810256",
    "To": "whatsapp:+16617952400",
    "Body": "Hola, prueba local"
}

print(f"Enviando prueba simulada a LOCAL: {URL}")
try:
    response = requests.post(URL, data=test_data)
    print(f"Status Code: {response.status_code}")
    print(f"Respuesta JSON: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
