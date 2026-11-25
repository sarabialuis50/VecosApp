import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('backend/.env')

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

try:
    # Get columns by fetching a single record
    res = supabase.table('clientes').select('*').limit(1).execute()
    if res.data:
        print("ALL COLUMNS:", sorted(list(res.data[0].keys())))
    else:
        # If no data, try to fetch some info about the table
        print("No clients found. Trying to insert a dummy to see columns (rollback)")
except Exception as e:
    print("Error:", e)
