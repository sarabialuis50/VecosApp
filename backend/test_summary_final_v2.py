
import os
import json
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv(override=True)

TWILIO_SID = os.environ.get("TWILIO_ACCOUNT_SID_MENU_IA")
TWILIO_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN_MENU_IA")
TWILIO_FROM = os.environ.get("TWILIO_WHATSAPP_FROM_MENU_IA")

NUMERO_PRUEBA = "3017810256"
# Plantilla: resumen_pedido
CONTENT_SID = "HX0a347542fcdee021da48601dab0775df"

# Datos
business_name = "Don Jediondo"
pedido_id_corto = "5574422A"
cliente_nombre = "Camilo Torres"
cliente_telefono = "3017810256"

detalle_carrito = f"\n* 1. Pizza con champiñones x1 ($40,000) \n*(1) Small, \n*(1) Medium, \n*(1) Borde de Queso, \n*(1) Orégano \n* Observación: Sin cebolla"

entrega_info = f"Domicilio \n\n* Dirección: Carrera 57 # 72-107 \n* Distancia: 2.0 Km \n* Observación de entrega: Al lado de la esquina"

resumen_pago = f"\n\n* Subtotal: $40,000 \n* Envío: $0 \n* TOTAL: $40,000\n"

cliente_info = f"\n\n*Nombre: {cliente_nombre} \n*Tel: {cliente_telefono}"

mapping = {
    "1": business_name,
    "2": pedido_id_corto,
    "3": cliente_info,
    "4": detalle_carrito,
    "5": entrega_info,
    "6": resumen_pago,
    "7": "Efectivo",
    "8": "Domicilio",
    "9": "09/03/2026, 23:27",
    "10": f"https://menuia.co/don-jediondo/mis-pedidos"
}

client = Client(TWILIO_SID, TWILIO_TOKEN)

print("--- VALIDATING VARIABLES ---")
for k, v in mapping.items():
    print(f"Var {k} length: {len(v)}")
    if len(v) > 1000:
        print(f"!!! WARNING: Var {k} too long")

try:
    msg = client.messages.create(
        from_=TWILIO_FROM,
        to=f"whatsapp:+57{NUMERO_PRUEBA}",
        content_sid=CONTENT_SID,
        content_variables=json.dumps(mapping)
    )
    print(f"SUCCESS! SID: {msg.sid}")
except Exception as e:
    print(f"FAILED: {e}")
