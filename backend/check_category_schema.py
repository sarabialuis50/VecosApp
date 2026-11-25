
import os
from supabase import create_client
from dotenv import load_dotenv
import json

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: Missing Supabase credentials")
    exit(1)

supabase = create_client(url, key)

def check_category_schema():
    print("Checking schema for 'categorias'...")
    try:
        # Check if table exists and has data
        res = supabase.table('categorias').select('*').limit(1).execute()
        if res.data:
            print("Columns found:", list(res.data[0].keys()))
            if 'icono' not in res.data[0].keys():
                print("Column 'icono' is missing.")
            else:
                print("Column 'icono' exists.")
        else:
            print("Table 'categorias' is empty or doesn't exist.")
            # Try to insert a dummy record to force error if column missing? No, that's messy.
            
    except Exception as e:
        print(f"Error checking schema: {e}")

if __name__ == "__main__":
    check_category_schema()
