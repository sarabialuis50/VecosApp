import os
import json
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

SID = os.environ.get("TWILIO_ACCOUNT_SID_MENU_IA")
TOKEN = os.environ.get("TWILIO_AUTH_TOKEN_MENU_IA")
FROM = os.environ.get("TWILIO_WHATSAPP_FROM_MENU_IA")

client = Client(SID, TOKEN)

TEMPLATE_SID = "HXf94d25186b54a3d484e794ec0de5fa27"
TO = "whatsapp:+573017810256"

# We'll test with ONLY ONE newline in ONE variable at a time
def test_var(var_key, value):
    try:
        payload = {str(i): "Val" for i in range(1, 11)}
        payload[var_key] = value
        client.messages.create(
            from_=FROM,
            to=TO,
            content_sid=TEMPLATE_SID,
            content_variables=json.dumps(payload)
        )
        return True, "Succeeded"
    except Exception as e:
        return False, str(e)

print("Testing variable '1' with newline...")
print(test_var("1", "Don\nJediondo"))

print("Testing variable '3' with newline...")
print(test_var("3", "Nombre: C\nTel: 1"))

print("Testing variable '4' with newline...")
print(test_var("4", "* Pizza\n* Soda"))
