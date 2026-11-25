import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

sid = os.environ.get("TWILIO_ACCOUNT_SID_MENU_IA")
token = os.environ.get("TWILIO_AUTH_TOKEN_MENU_IA")
from_number = os.environ.get("TWILIO_WHATSAPP_FROM_MENU_IA")
to_number = "+573128833350"  # User's number from log

print(f"Using SID: {sid}")
print(f"Using From: {from_number}")
print(f"Sending to: {to_number}")

client = Client(sid, token)

try:
    message = client.messages.create(
        from_=from_number,
        body="Test message from Menu.IA script",
        to=f"whatsapp:{to_number}"
    )
    print(f"Message SID: {message.sid}")
    print(f"Status: {message.status}")
except Exception as e:
    print(f"Error: {e}")
