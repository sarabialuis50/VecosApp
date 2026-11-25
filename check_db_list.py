import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('backend/.env')

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

try:
    res = supabase.table('clientes').select('*').limit(1).execute()
    if res.data:
        print("--- COLUMNS ---")
        for col in sorted(list(res.data[0].keys())):
            print(col)
        print("---------------")
    else:
        print("No clients found.")
except Exception as e:
    print("Error:", e)
