
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

# Try with numbered variables but VERY SHORT values (just text)
short_vars = {str(i+1): f"Test{i+1}" for i in range(10)}

print(f"Testing template {CONTENT_SID} with SHORT NUMBERED variables...")
try:
    message = client.messages.create(
        from_=FROM,
        to=TO,
        content_sid=CONTENT_SID,
        content_variables=json.dumps(short_vars)
    )
    print(f"SUCCESS with SHORT NUMBERED! SID: {message.sid}")
except Exception as e:
    print(f"FAILED with SHORT NUMBERED: {e}")
