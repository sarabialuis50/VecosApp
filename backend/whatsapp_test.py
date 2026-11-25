import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from whatsapp_agent import process_whatsapp_message

async def test_agent():
    print("--- Probando MenuBot con OpenAI ---")
    negocio_id = "test-negocio-id"
    sender_phone = "+573001234567"
    
    test_messages = [
        "Hola, quiero ver el menú",
        "¿Tienen hamburguesas?",
        "Quiero pedir una pizza"
    ]
    
    for msg in test_messages:
        print(f"\nUsuario: {msg}")
        response = await process_whatsapp_message(msg, sender_phone, negocio_id)
        print(f"MenuBot: {response}")

if __name__ == "__main__":
    asyncio.run(test_agent())
