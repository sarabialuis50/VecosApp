import requests
import json

URL = "https://menuia-production.up.railway.app/api/whatsapp/webhook"

# Simulamos un mensaje de WhatsApp que llega desde Twilio
# Usamos el formato exacto que Twilio enviaría (Form data)
test_data = {
    "From": "whatsapp:+573017810256",
    "To": "whatsapp:+16617952400",
    "Body": "Hola, prueba de conexión"
}

print(f"Enviando prueba simulada a: {URL}")
try:
    response = requests.post(URL, data=test_data)
    print(f"Status Code: {response.status_code}")
    # Si la respuesta es JSON, lo imprimimos bonito
    try:
        print(f"Respuesta JSON: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Respuesta Texto: {response.text}")
except Exception as e:
    print(f"Error: {e}")
