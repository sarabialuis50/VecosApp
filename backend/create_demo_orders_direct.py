from supabase import create_client
import datetime
import json
import uuid

# Use config directly
SUPABASE_URL = "https://kgzbixgmunmbgzlegobb.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnemJpeGdtdW5tYmd6bGVnb2JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY2OTAxMiwiZXhwIjoyMDg2MjQ1MDEyfQ.zweOUsel0LQ3ayoeH8DFgMFQBL1pAq0gGBjVk5IWoJA"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def create_demo_orders():
    try:
        slug = "don-jediondo"
        response = supabase.table('negocios').select('id').eq('slug', slug).execute()
        if not response.data:
            print("Negocio not found")
            return
        
        business_id = response.data[0]['id']
        print(f"Business ID: {business_id}")
        
        orders = [
            {
                "id": str(uuid.uuid4()),
                "negocio_id": business_id,
                "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "estado": "pendiente",
                "total": 43000,
                "mesa_numero": 1,
                "cliente_nombre": "Carlos Martínez",
                "tipo": "mesa",
                "items": [
                    {"producto_id": "p1", "nombre": "Bandeja Paisa", "cantidad": 1, "precio_unitario": 35000},
                    {"producto_id": "p2", "nombre": "Jugo de Mora", "cantidad": 1, "precio_unitario": 8000}
                ]
            },
            {
                "id": str(uuid.uuid4()),
                "negocio_id": business_id,
                "created_at": (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=15)).isoformat(),
                "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "estado": "preparando",
                "total": 86000,
                "mesa_numero": 4,
                "cliente_nombre": "Ana Ramos",
                "tipo": "mesa",
                "items": [
                    {"producto_id": "p3", "nombre": "Ajiaco Santafereño", "cantidad": 2, "precio_unitario": 28000},
                    {"producto_id": "p4", "nombre": "Cerveza Club Colombia", "cantidad": 2, "precio_unitario": 9000},
                    {"producto_id": "p5", "nombre": "Postre de Natas", "cantidad": 1, "precio_unitario": 12000}
                ]
            },
            {
                "id": str(uuid.uuid4()),
                "negocio_id": business_id,
                "created_at": (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=45)).isoformat(),
                "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "estado": "entregado",
                "total": 95000,
                "cliente_nombre": "Juan David (Rappi)",
                "tipo": "takeaway",
                "items": [
                    {"producto_id": "p6", "nombre": "Picada Familiar", "cantidad": 1, "precio_unitario": 85000},
                    {"producto_id": "p7", "nombre": "Gaseosa 1.5L", "cantidad": 1, "precio_unitario": 10000}
                ]
            }
        ]
        
        for order in orders:
            res = supabase.table('pedidos').insert(order).execute()
            print(f"Created order: {order['id']}")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_demo_orders()
