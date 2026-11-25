import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Configurar path para importar whatsapp_agent
sys.path.append(str(Path(__file__).parent))

load_dotenv()

from whatsapp_agent import send_whatsapp_response

def test_send():
    target_number = "+573128833350"
    message = "Hola, soy el agente de Menu.IA. Esta es una prueba de envío directo desde la plataforma oficial."
    
    print(f"Intentando enviar mensaje a {target_number}...")
    
    # Intentamos enviar usando la configuración global (SaaS_MenuIA)
    try:
        # La función envía y retorna None o levanta excepción si falla el cliente
        send_whatsapp_response(target_number, message)
        print("✅ Comando de envío ejecutado. Verifica si llegó el mensaje.")
    except Exception as e:
        print(f"❌ Error al enviar mensaje: {e}")

if __name__ == "__main__":
    test_send()
