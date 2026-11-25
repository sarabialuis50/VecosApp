import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def manual_delete():
    telefono = '4357688999' # Pedro Pablo
    slug = 'don-jediondo'
    
    # 1. Get biz ID
    biz = supabase.table('businesses').select('id, name').eq('slug', slug).execute()
    if not biz.data:
        print("Business not found")
        return
    biz_id = biz.data[0]['id']
    print(f"Business: {biz.data[0]['name']} (ID: {biz_id})")

    # 2. Find customer
    cust = supabase.table('clientes_puntos').select('*').match({"negocio_id": biz_id, "telefono": telefono}).execute()
    if not cust.data:
        print(f"Customer {telefono} not found in this biz")
        return
    cust_id = cust.data[0]['id']
    print(f"Found Customer ID: {cust_id}")

    # 3. Delete transactions
    try:
        trans = supabase.table('transacciones_puntos').delete().eq('cliente_id', cust_id).execute()
        print(f"Deleted {len(trans.data)} transactions")
    except Exception as e:
        print(f"Error deleting transactions: {e}")

    # 4. Delete customer
    try:
        res = supabase.table('clientes_puntos').delete().eq('id', cust_id).execute()
        print(f"Deleted customer record: {res.data}")
    except Exception as e:
        print(f"Error deleting customer: {e}")

if __name__ == "__main__":
    manual_delete()
