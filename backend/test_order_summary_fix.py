
import os
import json
import logging
from twilio.rest import Client
from dotenv import load_dotenv

# Set up logging to see what's happening
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Override load_dotenv to use the one in the current dir
load_dotenv(override=True)

# Import our template system (we'll copy/paste the logic for the test to be sure)
from whatsapp_agent import send_whatsapp_template

def test_full_summary_template():
    # Mock data based on server.py line 2087
    business_name = "Don Jediondo"
    slug = "don-jediondo"
    order_id = "5574422A"
    
    # 👤 DATOS DEL CLIENTE 
    cliente_info = f"\n\n*Nombre: Camilo Torres \n*Tel: 3017810256"
    
    # 🛒 DETALLE DEL PEDIDO 
    detalle_carrito = "\n* 1. Pizza con champiñones x1 ($40,000) \n*(1) Small, \n*(1) Medium, \n*(1) Borde de Queso, \n*(1) Orégano \n* Observación: Sin cebolla"
    
    # 🛵 ENTREGA Domicilio 
    # vertical formatting like line 2061-2072 of server.py
    entrega_info = "Domicilio \n\n* Dirección: Carrera 57 # 72-107 \n* Distancia: 2.0 Km \n* Observación de entrega: Al lado de la esquina"
    
    # 💳 RESUMEN DE PAGO 
    resumen_pago = "\n\n* Subtotal: $40,000 \n* Envío: $0 \n* TOTAL: $40,000\n"
    
    template_kwargs = {
        "negocio_nombre": business_name,
        "pedido_id": order_id,
        "cliente_info": cliente_info,
        "detalle_carrito": detalle_carrito,
        "entrega_info": entrega_info,
        "resumen_pago": resumen_pago,
        "metodo_pago": "Efectivo",
        "metodo_entrega": "Domicilio",
        "fecha": "09/03/2026, 23:27",
        "link_seguimiento": f"https://menuia.co/{slug}/mis-pedidos"
    }

    test_phone = "+573017810256" # Using the phone from the user example
    
    print(f"Testing template 'resumen_pedido' to {test_phone}...")
    
    try:
        sid = send_whatsapp_template(
            to_number=test_phone,
            template_key="resumen_pedido",
            **template_kwargs
        )
        if sid:
            print(f"SUCCESS! Message SID: {sid}")
        else:
            print("FAILED! send_whatsapp_template returned None (check logs).")
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    test_full_summary_template()
