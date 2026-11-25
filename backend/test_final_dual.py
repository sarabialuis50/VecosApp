
import os
import json
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv(override=True)

TWILIO_SID = os.environ.get("TWILIO_ACCOUNT_SID_MENU_IA")
TWILIO_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN_MENU_IA")
TWILIO_FROM = os.environ.get("TWILIO_WHATSAPP_FROM_MENU_IA")
FRONTEND_URL = "https://menuia.co"

NUMERO_PRUEBA = "3017810256"
REP_NOMBRE = "Carlos Repartidor"
REP_TEL = "3109876543"
CLI_NOMBRE = "Luis Cliente"
CLI_TEL = "3017810256"
BIZ_NOMBRE = "Don Jediondo"
ORDER_ID_SHORT = "104A88FC"
ORDER_ID_LONG = "104a88fc-9098-4164-b4aa-0d1c933727f6"
SLUG = "don-jediondo"

client = Client(TWILIO_SID, TWILIO_TOKEN)

# 1. Al REPARTIDOR (Plantilla: asignacion_repartidor)
# {{1}} Repartidor, {{2}} Negocio, {{3}} Cliente, {{4}} Tel Cliente, {{5}} Dirección, {{6}} PedidoID, {{7}} Link
vars_rep = {
    "1": REP_NOMBRE,
    "2": BIZ_NOMBRE,
    "3": CLI_NOMBRE,
    "4": CLI_TEL,
    "5": "Carrera 57 # 72-107",
    "6": ORDER_ID_SHORT,
    "7": f"{FRONTEND_URL}/reparto/{SLUG}/{ORDER_ID_LONG}"
}

# 2. Al CLIENTE (Plantilla: seguimiento_cliente)
# {{1}} Cliente, {{2}} Negocio, {{3}} Repartidor, {{4}} Tel Repartidor, {{5}} Dirección, {{6}} PedidoID, {{7}} Link
vars_cli = {
    "1": CLI_NOMBRE,
    "2": BIZ_NOMBRE,
    "3": REP_NOMBRE,
    "4": REP_TEL,
    "5": "Carrera 57 # 72-107",
    "6": ORDER_ID_SHORT,
    "7": f"{FRONTEND_URL}/{SLUG}/mis-pedidos?order={ORDER_ID_LONG}"
}

def test_send(to, template_sid, variables, label):
    print(f"\n--- Probando {label} ---")
    msg = client.messages.create(
        from_=TWILIO_FROM,
        to=f"whatsapp:+57{to}",
        content_sid=template_sid,
        content_variables=json.dumps(variables)
    )
    print(f"SID: {msg.sid} | Status: {msg.status}")

# Ejecutar
test_send(NUMERO_PRUEBA, "HX1743ee41809bd9c543ab1e5393ea7645", vars_rep, "REPARTIDOR")
test_send(NUMERO_PRUEBA, "HX3659bc5dccb53e716316f42582cf45b4", vars_cli, "CLIENTE")
