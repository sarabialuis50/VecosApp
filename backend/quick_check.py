import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

print(f"Checking Supabase: {url}")

businesses = supabase.table('negocios').select('id', 'nombre', 'slug').execute()
for b in businesses.data:
    bid = b['id']
    name = b['nombre']
    slug = b['slug']
    
    # Check productos table
    prod_res = supabase.table('productos').select('id', count='exact').eq('negocio_id', bid).execute()
    prod_count = prod_res.count if prod_res.count is not None else len(prod_res.data)
    
    # Check menu_items table
    item_res = supabase.table('menu_items').select('id', count='exact').eq('negocio_id', bid).execute()
    item_count = item_res.count if item_res.count is not None else len(item_res.data)
    
    print(f"Business: {name} ({slug}) | ID: {bid}")
    print(f"  - productos: {prod_count}")
    print(f"  - menu_items: {item_count}")
