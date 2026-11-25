
import os
import json
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv(override=True)

SID = os.environ.get("TWILIO_ACCOUNT_SID_MENU_IA")
TOKEN = os.environ.get("TWILIO_AUTH_TOKEN_MENU_IA")
FROM = os.environ.get("TWILIO_WHATSAPP_FROM_MENU_IA")
TO = "whatsapp:+573017810256"

CONTENT_SID = "HXf94d25186b54a3d484e794ec0de5fa27"

client = Client(SID, TOKEN)

# Try with spaces instead of \n
no_newline_vars = {
    "1": "Negocio TEST",
    "2": "ID123",
    "3": "Nombre: Camilo | Tel: 3017810256", # No \n
    "4": "1. Pizza x1 ($40,000) | (1) Small", # No \n
    "5": "Dirección: Calle 123",
    "6": "TOTAL: $40,000",
    "7": "Efectivo",
    "8": "Domicilio",
    "9": "2026-03-10",
    "10": "https://menuia.co"
}

print(f"Testing template {CONTENT_SID} with NO NEWLINES variables...")
try:
    message = client.messages.create(
        from_=FROM,
        to=TO,
        content_sid=CONTENT_SID,
        content_variables=json.dumps(no_newline_vars)
    )
    print(f"SUCCESS with NO NEWLINES! SID: {message.sid}")
except Exception as e:
    print(f"FAILED with NO NEWLINES: {e}")
