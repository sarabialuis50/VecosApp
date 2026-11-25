import os
from dotenv import load_dotenv
from twilio.rest import Client
import json
from whatsapp_templates import get_template_data

load_dotenv()

# Credentials
ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID_MENU_IA") or os.environ.get("TWILIO_ACCOUNT_SID")
AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN_MENU_IA") or os.environ.get("TWILIO_AUTH_TOKEN")
FROM_NUMBER = os.environ.get("TWILIO_WHATSAPP_FROM_MENU_IA") or os.environ.get("TWILIO_WHATSAPP_NUMBER")
TO_NUMBER = "whatsapp:+573123607283"  # Número indicado por el usuario

def test_send_template():
    client = Client(ACCOUNT_SID, AUTH_TOKEN)
    
    # Probando plantilla "resumen_pedido"
    template_key = "resumen_pedido"
    
    sid, variables_json = get_template_data(
        template_key,
        negocio_nombre="Menú.IA",
        pedido_id="TEST-1234",
        cliente_nombre="Luis",
        cliente_telefono="3017810256",
        detalle_carrito="2x Pizza Margarita\n1x Gaseosa",
        direccion="Calle Falsa 123",
        distancia="2.5 km",
        subtotal="45.000",
        costo_envio="5.000",
        total="50.000",
        metodo_pago="Efectivo",
        metodo_entrega="Domicilio",
        fecha="Hoy, 3:30 PM",
        link_seguimiento="https://menuia.co/pedidos/1234"
    )

    print(f"Enviando plantilla: {template_key}")
    print(f"SID: {sid}")
    print(f"Variables: {variables_json}")

    try:
        message = client.messages.create(
            from_=FROM_NUMBER,
            to=TO_NUMBER,
            content_sid=sid,
            content_variables=variables_json
        )
        print(f"\n✅ Mensaje enviado exitosamente!")
        print(f"   Message SID: {message.sid}")
        print(f"   Status: {message.status}")
    except Exception as e:
        print(f"\n❌ Error al enviar la plantilla: {e}")

if __name__ == "__main__":
    test_send_template()
