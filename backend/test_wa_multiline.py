
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

# Full summary but short values for some fields to isolate the issue
# We suspect multi-line content or total length
full_vars = {
    "1": "Negocio TEST", # Short
    "2": "ID123", # Short
    "3": "Nombre: Camilo\nTel: 3017810256", # Multi-line
    "4": "1. Pizza x1 ($40,000)\n(1) Small", # Multi-line
    "5": "Dirección: Calle 123", # Short
    "6": "TOTAL: $40,000", # Short
    "7": "Efectivo", # Short
    "8": "Domicilio", # Short
    "9": "2026-03-10", # Short
    "10": "https://menuia.co" # Short
}

print(f"Testing template {CONTENT_SID} with SIMPLE MULTILINE variables...")
try:
    message = client.messages.create(
        from_=FROM,
        to=TO,
        content_sid=CONTENT_SID,
        content_variables=json.dumps(full_vars)
    )
    print(f"SUCCESS with SIMPLE MULTILINE! SID: {message.sid}")
except Exception as e:
    print(f"FAILED with SIMPLE MULTILINE: {e}")
