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
        res = supabase.table(table_name).select('*').limit(1).execute()
        if res.data:
            print(list(res.data[0].keys()))
        else:
            print(f"Table '{table_name}' empty, cannot infer columns from data.")
    except Exception as e:
        print(f"Error accessing table '{table_name}': {e}")

if __name__ == "__main__":
    get_columns('productos')
    get_columns('negocios')
    get_columns('mesas')
    get_columns('pedidos')
