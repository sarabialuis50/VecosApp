import asyncio
import os
import sys
from dotenv import load_dotenv

# Asegurar que el path incluya la carpeta backend para importar whatsapp_agent
sys.path.append(os.path.join(os.getcwd(), 'backend'))

load_dotenv('backend/.env')

from whatsapp_agent import process_whatsapp_message

async def test_registration_flow():
    print("\n--- TEST: FLUJO DE REGISTRO DE CLIENTE POR WHATSAPP ---")
    negocio_id = "8ffc6795-392e-4670-a7b2-401e92152997"
    sender_phone = "+573100000000" # Un número nuevo para el test
    
    steps = [
        "Hola, me gustaría pedir algo",
        "Claro, me interesa registrarme para ganar puntos",
        "Mi nombre es Juan Perez y mi correo es juan@example.com. Mi cumple es el 15 de Octubre.",
        "Sí, usa este mismo número de WhatsApp."
    ]
    
    for i, msg in enumerate(steps):
        print(f"\n[Paso {i+1}] Usuario: {msg}")
        response = await process_whatsapp_message(msg, sender_phone, negocio_id)
        print(f"Menu.IA Bot: {response}")

if __name__ == "__main__":
    asyncio.run(test_registration_flow())
