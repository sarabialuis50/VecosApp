import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

def get_columns(table_name):
    print(f"\n--- Columns in '{table_name}' ---")
    try:
        # We can't directly query information_schema via postgrest, but we can try to select one row
        res = supabase.table(table_name).select('*').limit(1).execute()
        if res.data:
            print(list(res.data[0].keys()))
        else:
            print("Table empty, cannot infer columns from data.")
            # If empty, we can't easily see columns unless we try to insert dummy data and fail
    except Exception as e:
        print(f"Error accessing table: {e}")

def check_mesas_error():
    print("\n--- Testing Mesas Insert ---")
    try:
        dummy_table = {
            "negocio_id": "00000000-0000-0000-0000-000000000000",
            "numero": 9999,
            "capacidad": 4,
            "estado": "libre",
            "qr_code": "test"
        }
        res = supabase.table('mesas').insert(dummy_table).execute()
        print("Insert successful (unexpected if dummy logic)")
    except Exception as e:
        print(f"Insert failed as expected, Error: {e}")

if __name__ == "__main__":
    get_columns('negocios')
    get_columns('mesas')
    check_mesas_error()
