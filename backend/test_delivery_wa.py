import asyncio
import os
import sys
from pathlib import Path

# Add backend to path to import correctly
sys.path.append(str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

from server import notify_delivery_update_background

async def test_delivery_notif():
    print("--- Probando Notificación de Domicilio ---")
    
    # Needs real IDs from your DB to work, but let's check logs
    slug = "don-jediondo"
    # Try to get a recent order ID from DB first
    from supabase import create_client
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    supabase = create_client(url, key)
    
    res = supabase.table('pedidos').select('id, repartidor_id').limit(1).order('created_at', desc=True).execute()
    if res.data:
        order_id = res.data[0]['id']
        rep_id = res.data[0].get('repartidor_id')
        print(f"Usando Pedido ID: {order_id}")
        print(f"Repartidor ID: {rep_id}")
        
        if not rep_id:
             print("AVISO: El pedido no tiene repartidor_id asignado. La prueba de 'assignment' fallará.")
        
        print("\n1. Probando 'assignment' (al repartidor)...")
        notify_delivery_update_background(slug, order_id, 'assignment')
        
        print("\n2. Probando 'enviado' (al cliente)...")
        notify_delivery_update_background(slug, order_id, 'enviado')
    else:
        print("No se encontraron pedidos recientes en la base de datos.")

if __name__ == "__main__":
    asyncio.run(test_delivery_notif())
