import os
import json
from dotenv import load_dotenv
from twilio.rest import Client
from whatsapp_templates import get_template_data

load_dotenv()

# Configuración de credenciales
ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID_MENU_IA") or os.environ.get("TWILIO_ACCOUNT_SID")
AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN_MENU_IA") or os.environ.get("TWILIO_AUTH_TOKEN")
FROM_NUMBER = os.environ.get("TWILIO_WHATSAPP_FROM_MENU_IA") or os.environ.get("TWILIO_WHATSAPP_NUMBER")
TO_NUMBER = "whatsapp:+573123607283"  # Número de prueba

def test_asignacion_repartidor():
    client = Client(ACCOUNT_SID, AUTH_TOKEN)
    
    template_key = "asignacion_repartidor"
    
    # Datos de prueba para la plantilla
    payload = {
        "repartidor_nombre": "Carlos Alberto (Prueba)",
        "negocio_nombre": "Menú.IA Demo",
        "cliente_nombre": "Luis Cliente",
        "cliente_telefono": "+57301000000",
        "direccion_entrega": "Calle 100 # 15-20, Bogotá",
        "order_id_corto": "PRUEBA99",
        "link_seguimiento": "https://menuia.co/reparto/demo/order-99"
    }
    
    sid, variables = get_template_data(template_key, **payload)

    print(f"--- INICIANDO PRUEBA DE NOTIFICACIÓN ---")
    print(f"Template Key: {template_key}")
    print(f"WhatsApp SID: {sid}")
    print(f"Variables enviadas: {json.dumps(variables, indent=2)}")
    print(f"Destino: {TO_NUMBER}")
    print(f"----------------------------------------")

    try:
        message = client.messages.create(
            from_=FROM_NUMBER,
            to=TO_NUMBER,
            content_sid=sid,
            content_variables=json.dumps(variables)
        )
        print(f"\n[OK] PRUEBA EXITOSA!")
        print(f"Message SID: {message.sid}")
        print(f"Status: {message.status}")
        print(f"\nEl repartidor debería recibir el mensaje en unos segundos.")
    except Exception as e:
        print(f"\n[ERROR] ERROR EN LA PRUEBA: {e}")

if __name__ == "__main__":
    test_asignacion_repartidor()
