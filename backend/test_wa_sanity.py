
import os
import json
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv(override=True)

SID = os.environ.get("TWILIO_ACCOUNT_SID_MENU_IA")
TOKEN = os.environ.get("TWILIO_AUTH_TOKEN_MENU_IA")
FROM = os.environ.get("TWILIO_WHATSAPP_FROM_MENU_IA")
TO = "whatsapp:+573017810256"

client = Client(SID, TOKEN)

print(f"Testing direct message from {FROM} to {TO}...")
try:
    message = client.messages.create(
        from_=FROM,
        to=TO,
        body="Hola! Esto es una prueba de Menu.IA para el resumen de pedido."
    )
    print(f"Message sent! SID: {message.sid}")
except Exception as e:
    print(f"Error: {e}")
