import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def get_negocio_id():
    # Try finding by slug in 'negocios' table
    res = supabase.table('negocios').select('*').eq('slug', 'don-jediondo').execute()
    if res.data:
        print(f"Negocio ID: {res.data[0]['id']}")
        print(f"Columns: {res.data[0].keys()}")
    else:
        print("Negocio not found")

if __name__ == "__main__":
    get_negocio_id()
