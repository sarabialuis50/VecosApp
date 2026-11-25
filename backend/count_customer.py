import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def count_customer():
    telefono = '4357688999'
    res = supabase.table('clientes_puntos').select('*').eq('telefono', telefono).execute()
    print(f"Customer {telefono} records count: {len(res.data)}")
    if res.data:
        for c in res.data:
            print(f"ID: {c['id']}, Biz: {c['negocio_id']}")

if __name__ == "__main__":
    count_customer()
