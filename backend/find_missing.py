import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def find_missing_table():
    for t in ['clientes', 'clientes_puntos', 'businesses']:
        try:
            res = supabase.table(t).select('count', count='exact').execute()
            print(f"Table {t} accessible, count: {res.count}")
        except Exception as e:
            print(f"Error accessing {t}: {e}")

if __name__ == "__main__":
    find_missing_table()
