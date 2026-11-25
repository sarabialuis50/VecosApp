import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def list_clients_biz():
    res = supabase.table('clientes_puntos').select('negocio_id, telefono, nombre').limit(20).execute()
    print("Clients in table:")
    for r in res.data:
        print(f"Biz: {r['negocio_id']}, Phone: {r['telefono']}, Name: {r['nombre']}")

if __name__ == "__main__":
    list_clients_biz()
