
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

def get_schema():
    print("Checking schema for 'transacciones_puntos'...")
    try:
        res = supabase.table('transacciones_puntos').select('*').limit(1).execute()
        if res.data:
            print("Columns found in transacciones_puntos:", list(res.data[0].keys()))
        else:
            print("Table transacciones_puntos is empty.")
            
    except Exception as e:
        print(f"Error checking transacciones_puntos: {e}")

if __name__ == "__main__":
    get_schema()
