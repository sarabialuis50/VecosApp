
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

# Try with named variables FIRST
named_vars = {
    "negocio_nombre": "Don Jediondo",
    "pedido_id": "5574422A",
    "cliente_info": "\n\n*Nombre: Camilo Torres \n*Tel: 3017810256",
    "detalle_carrito": "\n* 1. Pizza con champiñones x1 ($40,000) \n*(1) Small, \n*(1) Medium, \n*(1) Borde de Queso, \n*(1) Orégano \n* Observación: Sin cebolla",
    "entrega_info": "Domicilio \n\n* Dirección: Carrera 57 # 72-107 \n* Distancia: 2.0 Km \n* Observación de entrega: Al lado de la esquina",
    "resumen_pago": "\n\n* Subtotal: $40,000 \n* Envío: $0 \n* TOTAL: $40,000\n",
    "metodo_pago": "Efectivo",
    "metodo_entrega": "Domicilio",
    "fecha": "09/03/2026, 23:27",
    "link_seguimiento": "https://menuia.co/don-jediondo/mis-pedidos"
}

print(f"Testing template {CONTENT_SID} with NAMED variables...")
try:
    message = client.messages.create(
        from_=FROM,
        to=TO,
        content_sid=CONTENT_SID,
        content_variables=json.dumps(named_vars)
    )
    print(f"SUCCESS with NAMED! SID: {message.sid}")
except Exception as e:
    print(f"FAILED with NAMED: {e}")

# Try with numbered variables (just to be sure)
numbered_vars = {str(i+1): val for i, val in enumerate(named_vars.values())}
print(f"Testing template {CONTENT_SID} with NUMBERED variables...")
try:
    message = client.messages.create(
        from_=FROM,
        to=TO,
        content_sid=CONTENT_SID,
        content_variables=json.dumps(numbered_vars)
    )
    print(f"SUCCESS with NUMBERED! SID: {message.sid}")
except Exception as e:
    print(f"FAILED with NUMBERED: {e}")
