import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def check_all():
    slug = 'don-jediondo'
    # 1. Get biz info
    biz_res = supabase.table('businesses').select('id, name').eq('slug', slug).execute()
    if not biz_res.data:
        print("Biz not found")
        return
    biz_id = biz_res.data[0]['id']
    print(f"Biz Name: {biz_res.data[0]['name']} (ID: {biz_id})")

    # 2. Find Luis Perez in that biz
    telefono = '2345678900'
    cust_res = supabase.table('clientes_puntos').select('*').match({
        "negocio_id": biz_id,
        "telefono": telefono
    }).execute()
    
    if not cust_res.data:
        print(f"Customer {telefono} NOT found in biz {biz_id}")
    else:
        print(f"Customer found! Row: {cust_res.data[0]}")

if __name__ == "__main__":
    check_all()
