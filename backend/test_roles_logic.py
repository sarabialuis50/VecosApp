
import os
import json
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv(override=True)

TWILIO_SID = os.environ.get("TWILIO_ACCOUNT_SID_MENU_IA")
TWILIO_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN_MENU_IA")
TWILIO_FROM = os.environ.get("TWILIO_WHATSAPP_FROM_MENU_IA")
FRONTEND_URL = "https://menuia.co"

# Datos para simular
NUMERO_PRUEBA = "3017810256" # Tu número para recibir ambos
REP_NOMBRE = "Carlos Repartidor"
REP_TEL = "3109876543"
CLI_NOMBRE = "Luis Cliente"
CLI_TEL = "3017810256"
BIZ_NOMBRE = "Don Jediondo"
ORDER_ID_SHORT = "104A88FC"
ORDER_ID_LONG = "104a88fc-9098-4164-b4aa-0d1c933727f6"
SLUG = "don-jediondo"

client = Client(TWILIO_SID, TWILIO_TOKEN)

def send_template(to, variables, label):
    print(f"\n--- Enviando a {label} ---")
    print(f"Variables: {json.dumps(variables, indent=2)}")
    msg = client.messages.create(
        from_=TWILIO_FROM,
        to=f"whatsapp:+57{to}",
        content_sid="HX1743ee41809bd9c543ab1e5393ea7645",
        content_variables=json.dumps(variables)
    )
    print(f"SID: {msg.sid} | Status: {msg.status}")

# 1. Simular envío al REPARTIDOR (Lógica normal)
params_rep = {
    "1": REP_NOMBRE,           # Estimado {{1}}
    "2": BIZ_NOMBRE,           # Negocio {{2}}
    "3": CLI_NOMBRE,           # Entregar a {{3}}
    "4": CLI_TEL,              # Tel {{4}}
    "5": "Carrera 57 # 72-107",# Dirección {{5}}
    "6": ORDER_ID_SHORT,       # ID {{6}}
    "7": f"{FRONTEND_URL}/reparto/{SLUG}/{ORDER_ID_LONG}" # Link {{7}}
}
send_template(NUMERO_PRUEBA, params_rep, "REPARTIDOR (Simulado)")

# 2. Simular envío al CLIENTE (Lógica invertida)
params_cli = {
    "1": CLI_NOMBRE,           # Estimado {{1}} (Ahora es el Cliente)
    "2": BIZ_NOMBRE,           # Negocio {{2}}
    "3": REP_NOMBRE,           # Entregar por {{3}} (Ahora es el Repartidor)
    "4": REP_TEL,              # Tel {{4}} (Ahora es el Tel del Repartidor)
    "5": "Carrera 57 # 72-107",# Dirección {{5}}
    "6": ORDER_ID_SHORT,       # ID {{6}}
    "7": f"{FRONTEND_URL}/{SLUG}/mis-pedidos?order={ORDER_ID_LONG}" # Link {{7}}
}
send_template(NUMERO_PRUEBA, params_cli, "CLIENTE (Simulado)")
