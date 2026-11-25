import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

def test_create_product():
    biz_res = supabase.table('negocios').select('id').limit(1).execute()
    if not biz_res.data:
        print("No businesses found")
        return
    business_id = biz_res.data[0]['id']

    product_data = {
        "negocio_id": business_id,
        "nombre": "Schema Test",
        "precio": 100,
        "categoria": "Test"
    }

    try:
        res = supabase.table('productos').insert(product_data).execute()
        if res.data:
            print("DB Columns found:", list(res.data[0].keys()))
            # Clean up
            supabase.table('productos').delete().eq('id', res.data[0]['id']).execute()
    except Exception as e:
        print("FAILED:", e)

if __name__ == "__main__":
    test_create_product()
