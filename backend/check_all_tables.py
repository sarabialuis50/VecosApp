import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def check_all_tables():
    # Use a common table to see schema columns as a side effect
    try:
        res = supabase.table('clientes_puntos').select('*').limit(1).execute()
        print("Clientes Puntos columns:", res.data[0].keys())
    except Exception as e:
        print("Error reading clientes_puntos:", e)

    # Check for tables
    all_tables = ['clientes_puntos', 'transacciones_puntos', 'canjes_puntos', 'canjes', 'redenciones', 'pedidos']
    found = []
    for t in all_tables:
        try:
             res = supabase.table(t).select('id').limit(0).execute()
             found.append(t)
        except:
             pass
    print("Found tables:", found)

if __name__ == "__main__":
    check_all_tables()
