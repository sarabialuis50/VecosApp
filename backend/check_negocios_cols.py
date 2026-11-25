import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def check_negocios_cols():
    try:
        res = supabase.table('negocios').select('*').limit(1).execute()
        if res.data:
            print("Columns in 'negocios' table:", res.data[0].keys())
        else:
            print("Table 'negocios' is empty.")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    check_negocios_cols()
