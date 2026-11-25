import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def clean_demo_data():
    slug = 'don-jediondo'
    biz_id = '37a07d0f-e8b4-4f23-bfe9-02be72d76c28'
    
    print(f"CLEANING DATA FOR BIZ: {slug} (ID: {biz_id})")

    # 1. First, delete all point transactions for this business
    try:
        t_res = supabase.table('transacciones_puntos').delete().eq('negocio_id', biz_id).execute()
        print(f"Deleted {len(t_res.data)} transactions from 'transacciones_puntos'.")
    except Exception as e:
        print(f"Error deleting transactions: {e}")

    # 2. Finally, delete all customers for this business
    try:
        c_res = supabase.table('clientes_puntos').delete().eq('negocio_id', biz_id).execute()
        print(f"Deleted {len(c_res.data)} customers from 'clientes_puntos'.")
    except Exception as e:
        print(f"Error deleting customers: {e}")

if __name__ == "__main__":
    clean_demo_data()
