
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

# Test each multiline variable individually
results = []

for i in range(1, 11):
    test_vars = {str(j+1): "Test" for j in range(10)}
    test_vars[str(i)] = "Line1\nLine2"
    
    print(f"Testing variable {i} with MULTILINE...")
    try:
        message = client.messages.create(
            from_=FROM,
            to=TO,
            content_sid=CONTENT_SID,
            content_variables=json.dumps(test_vars)
        )
        print(f"SUCCESS with var {i}!")
        results.append((i, True))
    except Exception as e:
        print(f"FAILED with var {i}: {e}")
        results.append((i, False))

print("\n--- RESULTS ---")
for i, res in results:
    print(f"Variable {i}: {'OK' if res else 'FAIL'}")
