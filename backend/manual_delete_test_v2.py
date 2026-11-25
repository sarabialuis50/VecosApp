import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def manual_delete_v2():
    telefono = '4357688999' # Pedro Pablo
    
    # 1. Find customer directly
    cust = supabase.table('clientes_puntos').select('*').eq("telefono", telefono).execute()
    if not cust.data:
        print(f"Customer {telefono} not found anywhere")
        return
    
    for c in cust.data:
        cust_id = c['id']
        biz_id = c['negocio_id']
        print(f"Customer ID: {cust_id}, Biz ID: {biz_id}")

        # Try to delete transactions first
        try:
            # Check column existence first
            res_test = supabase.table('transacciones_puntos').select('id').limit(1).execute()
            print("Table transacciones_puntos exists")
            
            # Use query with count to see if any exist
            trans = supabase.table('transacciones_puntos').delete().eq('cliente_id', cust_id).execute()
            print(f"Deleted transactions: {trans.data}")
        except Exception as e:
            print(f"Error transactions: {e}")

        # Try to delete customer
        try:
            res = supabase.table('clientes_puntos').delete().eq('id', cust_id).execute()
            print(f"Deleted customer: {res.data}")
        except Exception as e:
            print(f"Error customer: {e}")

if __name__ == "__main__":
    manual_delete_v2()
