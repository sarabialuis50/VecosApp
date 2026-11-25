import os
from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv()

ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID_MENU_IA") or os.environ.get("TWILIO_ACCOUNT_SID")
AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN_MENU_IA") or os.environ.get("TWILIO_AUTH_TOKEN")

def check_status(message_sid):
    client = Client(ACCOUNT_SID, AUTH_TOKEN)
    message = client.messages(message_sid).fetch()
    print(f"Status of {message_sid}: {message.status}")
    if message.error_code:
        print(f"Error Code: {message.error_code}")
        print(f"Error Message: {message.error_message}")

import sys
if __name__ == "__main__":
    sid = sys.argv[1] if len(sys.argv) > 1 else "MM29281d4787f73f272da8ffe10edd5727"
    check_status(sid)
