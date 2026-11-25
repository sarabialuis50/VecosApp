import os
from dotenv import load_dotenv
from supabase import create_client, Client
from pathlib import Path
import uuid
from datetime import datetime, timezone

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found in environment variables.")
    exit(1)

supabase: Client = create_client(url, key)

def migrate_data():
    print("Starting migration from 'productos' to 'menu_items'...")
    
    # Fetch all existing products
    response = supabase.table('productos').select('*').execute()
    productos = response.data
    
    if not productos:
        print("No products found in the 'productos' table.")
        return
    
    print(f"Found {len(productos)} products to migrate.")
    
    success_count = 0
    error_count = 0
    
    for prod in productos:
        try:
            # Map old fields to new fields
            menu_item = {
                'id': prod.get('id', str(uuid.uuid4())),
                'negocio_id': prod.get('negocio_id'),
                'name': prod.get('nombre'),
                'description': prod.get('descripcion'),
                'base_price': prod.get('precio', 0.0),
                'currency': "COP",
                'category': prod.get('categoria'),
                'image_url': prod.get('imagen'),
                'is_recommended': prod.get('destacado', False),
                'precio_original': prod.get('precio_original'),
                'oferta_porcentaje': prod.get('oferta_porcentaje'),
                'is_spicy': False,
                'is_vegan': False,
                'is_vegetarian': False,
                'is_gluten_free': False,
                'allergens': [],
                'available': prod.get('disponible', True),
                'created_at': prod.get('created_at', datetime.now(timezone.utc).isoformat()),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
            
            # Insert into menu_items
            # We use upsert to avoid duplicate key errors if run multiple times
            res = supabase.table('menu_items').upsert(menu_item).execute()
            
            # Migrate tags if exists
            etiqueta = prod.get('etiqueta')
            if etiqueta:
                tag_data = {
                    'menu_item_id': menu_item['id'],
                    'tag': etiqueta
                }
                # Optional: Handle duplicate tags carefully if re-running
                supabase.table('menu_item_tags').insert(tag_data).execute()
            
            # Migrate modifiers to options
            modifiers = prod.get('modificadores', [])
            if modifiers:
                for mod in modifiers:
                    # mod format might be dict with name, price, etc.
                    # Or just list of strings depending on how it was stored
                    # Assume dict for now, if it fails, exception will be caught
                    if isinstance(mod, dict):
                        opt_data = {
                            'menu_item_id': menu_item['id'],
                            'type': mod.get('type', 'extra'),
                            'name': mod.get('name', mod.get('nombre', 'Mofidier')),
                            'price_delta': mod.get('price_delta', mod.get('precio', 0.0)),
                        }
                        supabase.table('menu_item_options').insert(opt_data).execute()
                        
            success_count += 1
            print(f"  Migrated '{menu_item['name']}' successfully.")
            
        except Exception as e:
            print(f"  Error migrating product '{prod.get('nombre')}': {str(e)}")
            error_count += 1
            
    print(f"\nMigration completed.")
    print(f"Success: {success_count}")
    print(f"Errors: {error_count}")

if __name__ == "__main__":
    migrate_data()
