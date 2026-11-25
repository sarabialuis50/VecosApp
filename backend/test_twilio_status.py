import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

sid = os.environ.get("TWILIO_ACCOUNT_SID_MENU_IA")
token = os.environ.get("TWILIO_AUTH_TOKEN_MENU_IA")
from_number = os.environ.get("TWILIO_WHATSAPP_FROM_MENU_IA")

print(f"SID: {sid}")
print(f"From Number raw: {from_number}")
print()

client = Client(sid, token)

# List WhatsApp senders registered in this account
print("=== Incoming Phone Numbers ===")
try:
    phone_numbers = client.incoming_phone_numbers.list()
    for num in phone_numbers:
        print(f"  Number: {num.phone_number} | SMS: {num.capabilities.get('sms', False)} | Voice: {num.capabilities.get('voice', False)}")
except Exception as e:
    print(f"  Error listing numbers: {e}")

print()
print("=== Last 5 Messages Sent ===")
try:
    messages = client.messages.list(limit=5)
    for m in messages:
        print(f"  [{m.date_sent}] {m.from_} -> {m.to} | Status: {m.status} | Error: {m.error_message}")
except Exception as e:
    print(f"  Error listing messages: {e}")
