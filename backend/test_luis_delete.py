import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def test_luis_delete():
    telefono = '2345678900'
    slug = 'don-jediondo'
    
    print(f"--- TESTING DELETE FOR {telefono} IN {slug} ---")
    
    # 1. Get business
    biz = supabase.table('negocios').select('*').eq('slug', slug).execute()
    if not biz.data:
        print("Business not found in 'negocios' table")
        return
    business = biz.data[0]
    biz_id = business['id']
    print(f"Found business '{business['name']}' with ID: {biz_id}")

    # 2. Match customer
    customer_res = supabase.table('clientes_puntos').select('id').match({
        "negocio_id": biz_id,
        "telefono": telefono
    }).execute()
    
    if not customer_res.data:
        print(f"Customer {telefono} not found for this business ID.")
        # Check if it exists for ANY business ID
        any_cust = supabase.table('clientes_puntos').select('negocio_id').eq('telefono', telefono).execute()
        if any_cust.data:
             print(f"Customer EXISTS but for DIFFERENT business IDs: {[r['negocio_id'] for r in any_cust.data]}")
        else:
             print("Customer not found at all in 'clientes_puntos'")
        return
    
    cliente_id = customer_res.data[0]['id']
    print(f"Customer {telefono} found with internal ID: {cliente_id}")

    # 3. Simulate full deletion process
    try:
        print("Step 1: Deleting from transacciones_puntos...")
        t_res = supabase.table('transacciones_puntos').delete().eq('cliente_id', cliente_id).execute()
        print(f"Done. Affected: {len(t_res.data)}")
        
        print("Step 2: Deleting from clientes_puntos...")
        c_res = supabase.table('clientes_puntos').delete().eq('id', cliente_id).execute()
        print(f"Done. Affected: {len(c_res.data)}")
        
        if c_res.data:
            print("SUCCESS: Customer deleted from database.")
        else:
            print("FAILURE: No record was deleted from 'clientes_puntos'.")
            
    except Exception as e:
        print(f"EXCEPTION during deletion: {e}")

if __name__ == "__main__":
    test_luis_delete()
