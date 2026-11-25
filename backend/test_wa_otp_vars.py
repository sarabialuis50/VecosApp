
import os
import json
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv(override=True)

SID = os.environ.get("TWILIO_ACCOUNT_SID_MENU_IA")
TOKEN = os.environ.get("TWILIO_AUTH_TOKEN_MENU_IA")
FROM = os.environ.get("TWILIO_WHATSAPP_FROM_MENU_IA")
TO = "whatsapp:+573017810256"

CONTENT_SID = "HX42003eb243fd020dbeaa9d9b983e7ea4" # codigo_verificacion

client = Client(SID, TOKEN)

# Try with named
named_vars = {
    "otp_code": "123456",
    "negocio_nombre": "Menu.IA"
}

print(f"Testing template {CONTENT_SID} with NAMED...")
try:
    message = client.messages.create(
        from_=FROM,
        to=TO,
        content_sid=CONTENT_SID,
        content_variables=json.dumps(named_vars)
    )
    print(f"SUCCESS with NAMED! SID: {message.sid}")
except Exception as e:
    print(f"FAILED with NAMED: {e}")

# Try with numbered ("1", "2")
numbered_vars = {"1": "123456", "2": "Menu.IA"}
print(f"Testing template {CONTENT_SID} with NUMBERED...")
try:
    message = client.messages.create(
        from_=FROM,
        to=TO,
        content_sid=CONTENT_SID,
        content_variables=json.dumps(numbered_vars)
    )
    print(f"SUCCESS with NUMBERED! SID: {message.sid}")
except Exception as e:
    print(f"FAILED with NUMBERED: {e}")
