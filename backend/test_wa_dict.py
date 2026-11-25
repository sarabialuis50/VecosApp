
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

# Full summary but NO json.dumps (pass DICT directly)
full_vars = {
    "1": "Negocio TEST",
    "2": "ID123",
    "3": "Nombre: Camilo\nTel: 3017810256", 
    "4": "1. Pizza x1 ($40,000)\n(1) Small", 
    "5": "Dirección: Calle 123",
    "6": "TOTAL: $40,000",
    "7": "Efectivo",
    "8": "Domicilio",
    "9": "2026-03-10",
    "10": "https://menuia.co"
}

print(f"Testing template {CONTENT_SID} with MULTILINE (DICT directly)...")
try:
    # content_variables passed as dict
    message = client.messages.create(
        from_=FROM,
        to=TO,
        content_sid=CONTENT_SID,
        content_variables=full_vars 
    )
    print(f"SUCCESS with MULTILINE (DICT)! SID: {message.sid}")
except Exception as e:
    print(f"FAILED with MULTILINE (DICT): {e}")
