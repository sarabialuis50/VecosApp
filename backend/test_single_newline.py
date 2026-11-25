
import os
import json
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv(override=True)

TWILIO_SID = os.environ.get("TWILIO_ACCOUNT_SID_MENU_IA")
TWILIO_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN_MENU_IA")
TWILIO_FROM = os.environ.get("TWILIO_WHATSAPP_FROM_MENU_IA")

NUMERO_PRUEBA = "3017810256"
# Plantilla: resumen_pedido
CONTENT_SID = "HX0a347542fcdee021da48601dab0775df"

# Test with SINGLE newline
mapping = {
    "1": "Test Negocio",
    "2": "TEST-ID",
    "3": "Luis\nTel: 301", # Single newline
    "4": "Item 1\nItem 2",
    "5": "Dir: 123",
    "6": "Total: 100",
    "7": "Efectivo",
    "8": "Domicilio",
    "9": "10/03",
    "10": "https://menuia.co"
}

client = Client(TWILIO_SID, TWILIO_TOKEN)

try:
    msg = client.messages.create(
        from_=TWILIO_FROM,
        to=f"whatsapp:+57{NUMERO_PRUEBA}",
        content_sid=CONTENT_SID,
        content_variables=json.dumps(mapping)
    )
    print(f"SUCCESS SID: {msg.sid}")
except Exception as e:
    print(f"FAILED: {e}")
