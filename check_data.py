import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('backend/.env')

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

try:
    res = supabase.table('clientes').select('*').limit(5).execute()
    for row in res.data:
        print(f"Tel: {row.get('telefono')} | PIN: {row.get('pin')} | PW_HASH: {row.get('password_hash')}")
except Exception as e:
    print("Error:", e)
