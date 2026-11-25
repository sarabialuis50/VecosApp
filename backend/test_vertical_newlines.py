import os
import json
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

SID = os.environ.get("TWILIO_ACCOUNT_SID_MENU_IA")
TOKEN = os.environ.get("TWILIO_AUTH_TOKEN_MENU_IA")
FROM = os.environ.get("TWILIO_WHATSAPP_FROM_MENU_IA")

client = Client(SID, TOKEN)

# Current working template SID
TEMPLATE_SID = "HXf94d25186b54a3d484e794ec0de5fa27"

# Recipient (user's phone from metadata or logs)
TO = "whatsapp:+573017810256" # Using the user's phone from previous logs

# Variables with newlines to see if it fails
VARIABLES = {
    "1": "Don Jediondo",
    "2": "TEST-1234",
    "3": "Nombre: Camilo\nTel: 3012345678",
    "4": "* Item 1 x1\n* Item 2 x2",
    "5": "Carrera 57\nDistancia: 3Km",
    "6": "Subtotal: $10k\nTotal: $12k",
    "7": "Efectivo",
    "8": "Domicilio",
    "9": "10/03/2026, 11:30 am",
    "10": "https://menuia.co"
}

try:
    message = client.messages.create(
        from_=FROM,
        to=TO,
        content_sid=TEMPLATE_SID,
        content_variables=json.dumps(VARIABLES)
    )
    print(f"Success! SID: {message.sid}")
except Exception as e:
    print(f"FAILED: {e}")
