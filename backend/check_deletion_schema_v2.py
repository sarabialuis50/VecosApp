import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def check_schema():
    # Check if clientes_puntos has data
    try:
        res = supabase.table('clientes_puntos').select('*').limit(5).execute()
        print("Clientes Puntos (first 5):", res.data)
    except Exception as e:
        print("Error reading clientes_puntos:", e)

    # Check for other potential tables
    for t in ['transacciones_puntos', 'puntos_transacciones', 'redenciones', 'canjes']:
        try:
             res = supabase.table(t).select('id').limit(1).execute()
             print(f"Table {t} EXISTS")
        except:
             print(f"Table {t} DOES NOT EXIST")

if __name__ == "__main__":
    check_schema()
