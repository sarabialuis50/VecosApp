import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def check_trans_cols():
    try:
        res = supabase.table('transacciones_puntos').select('*').limit(1).execute()
        if res.data:
            print(f"Sample data: {res.data[0]}")
            print(f"Columns: {res.data[0].keys()}")
        else:
            print("Table found but empty.")
    except Exception as e:
        print("Error reading transacciones_puntos:", e)

if __name__ == "__main__":
    check_trans_cols()
