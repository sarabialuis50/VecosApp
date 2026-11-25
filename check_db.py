import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv('backend/.env')

url = os.environ.get("SUPABASE_URL") or "https://kgzbixgmunmbgzlegobb.supabase.co"
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

try:
    # Try to fetch one client to see the columns
    res = supabase.table('clientes').select('*').limit(1).execute()
    if res.data:
        print("Columns in 'clientes':", list(res.data[0].keys()))
    else:
        print("No clients found, can't determine columns from data.")
except Exception as e:
    print("Error:", e)
