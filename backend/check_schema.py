
import os
from supabase import create_client
from dotenv import load_dotenv
import json

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

def get_schema():
    print("Checking schema for 'clientes_puntos'...")
    try:
        # Try to insert a dummy record to see constraints or just select one
        # Actually, let's just try to select * limit 1 and print keys
        res = supabase.table('clientes_puntos').select('*').limit(1).execute()
        if res.data:
            print("Columns found:", list(res.data[0].keys()))
        else:
            print("Table empty, cannot infer columns from data.")
            # We can try to insert a dummy with 'email' and see if it errors?
            # Or better, just assume we might need to add it.
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_schema()
