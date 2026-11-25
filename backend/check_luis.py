import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def check_luis():
    res = supabase.table('clientes_puntos').select('*').eq('telefono', '2345678900').execute()
    print(f"Customer 2345678900 records count: {len(res.data)}")

if __name__ == "__main__":
    check_luis()
