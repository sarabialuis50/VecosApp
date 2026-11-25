"""
Test to verify that Twilio is configured correctly and can receive/send WhatsApp messages.
"""
import os
from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv()

# Credentials
ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID_MENU_IA") or os.environ.get("TWILIO_ACCOUNT_SID")
AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN_MENU_IA") or os.environ.get("TWILIO_AUTH_TOKEN")
FROM_NUMBER = os.environ.get("TWILIO_WHATSAPP_FROM_MENU_IA") or os.environ.get("TWILIO_WHATSAPP_NUMBER")
TO_NUMBER = "whatsapp:+573017810256"  # Luis's number (the owner for testing)

print(f"account_sid: {ACCOUNT_SID[:8]}..." if ACCOUNT_SID else "MISSING account_sid!")
print(f"auth_token: {AUTH_TOKEN[:8]}..." if AUTH_TOKEN else "MISSING auth_token!")
print(f"from_number: {FROM_NUMBER}")
print(f"to_number: {TO_NUMBER}")

try:
    client = Client(ACCOUNT_SID, AUTH_TOKEN)
    message = client.messages.create(
        body="✅ Prueba de envío directo desde el servidor. Si recibes esto, Twilio está funcionando correctamente.",
        from_=FROM_NUMBER,
        to=TO_NUMBER
    )
    print(f"\n✅ Mensaje enviado exitosamente!")
    print(f"   SID: {message.sid}")
    print(f"   Status: {message.status}")
except Exception as e:
    print(f"\n❌ Error al enviar: {e}")
