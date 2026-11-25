
import os
import json
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv(override=True)

TWILIO_SID = os.environ.get("TWILIO_ACCOUNT_SID_MENU_IA")
TWILIO_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN_MENU_IA")
TWILIO_FROM = os.environ.get("TWILIO_WHATSAPP_FROM_MENU_IA")

NUMERO_PRUEBA = "3017810256"
CONTENT_SID = "HX0a347542fcdee021da48601dab0775df" # resumen_pedido

# --- Lógica de Formateo Identica al Servidor ---
business_name = "Don Jediondo"
pedido_id_corto = "5574422A"
cliente_nombre = "Camilo Torres"
cliente_telefono = "3017810256"

# Detalle Carrito
detalle_carrito = ""
item_qty = 1
# Item 1 con sus modificadores
detalle_carrito += f"\n* 1. Pizza con champiñones x{item_qty} ($40,000) "
mods = ["Small", "Medium", "Borde de Queso", "Orégano"]
for m in mods:
    detalle_carrito += f"\n*({item_qty}) {m}, "
detalle_carrito += f"\n* Observación: Sin cebolla"

# Entrega Info
metodo_entrega = "Domicilio"
entrega_lines = [f"{metodo_entrega} \n"]
entrega_lines.append(f"* Dirección: Carrera 57 # 72-107")
entrega_lines.append(f"* Distancia: 2.0 Km")
entrega_lines.append(f"* Observación de entrega: Al lado de la esquina")
entrega_info = f"{entrega_lines[0]}\n" + "\n".join(entrega_lines[1:])

# Resumen Pago
resumen_pago = f"\n\n* Subtotal: $40,000 \n* Envío: $0 \n* TOTAL: $40,000\n"

# Cliente Info
cliente_info = f"\n\n*Nombre: {cliente_nombre} \n*Tel: {cliente_telefono}"

variables = {
    "1": business_name,      # 🔔 Nuevo Pedido - [Negocio]
    "2": pedido_id_corto,   # 🆔 ID del Pedido: [ID]
    "3": cliente_info,       # 👤 DATOS DEL CLIENTE [Info]
    "4": detalle_carrito,    # 🛒 DETALLE DEL PEDIDO [Detalle]
    "5": entrega_info,       # 🛵 ENTREGA [Entrega Info]
    "6": resumen_pago,       # 💳 RESUMEN DE PAGO [Totales]
    "7": "Efectivo",         # 💵 Método de Pago: [Pago]
    "8": metodo_entrega,     # 🚚 Método de Entrega: [Entrega]
    "9": "09/03/2026, 23:27",# ⏰ Realizado: [Fecha]
    "10": f"https://menuia.co/don-jediondo/mis-pedidos" # 🔗 Ver mi pedido: [Link]
}

client = Client(TWILIO_SID, TWILIO_TOKEN)

print(f"\n--- Probando RESUMEN FINAL VIRTICAL ---")
print(f"To: {NUMERO_PRUEBA}")
print(f"Entrega Info:\n{entrega_info}")

msg = client.messages.create(
    from_=TWILIO_FROM,
    to=f"whatsapp:+57{NUMERO_PRUEBA}",
    content_sid=CONTENT_SID,
    content_variables=json.dumps(variables)
)

print(f"SID: {msg.sid} | Status: {msg.status}")
