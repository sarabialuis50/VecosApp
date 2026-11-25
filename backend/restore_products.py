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

supabase: Client = create_client(url, key)

def restore_products():
    # Target business: Bandeja paisa (bandeja-paisa)
    # ID: a255305e-fcd9-4c4f-9ed3-abecf53b0546
    business_id = 'a255305e-fcd9-4c4f-9ed3-abecf53b0546'
    
    missing_products = [
        {"name": "Bandeja Paisa", "base_price": 35000, "category": "Platos Fuertes", "description": "El clásico antioqueño con frijoles, arroz, carne, chicharrón, huevo, arepa, tajada y aguacate."},
        {"name": "Jugo de Mora", "base_price": 8000, "category": "Bebidas", "description": "Jugo natural de mora en agua o leche."},
        {"name": "Ajiaco Santafereño", "base_price": 28000, "category": "Platos Fuertes", "description": "Sopa tradicional con tres tipos de papa, pollo, guascas, mazorca, crema de leche y alcaparras."},
        {"name": "Cerveza Club Colombia", "base_price": 9000, "category": "Bebidas", "description": "Cerveza nacional premium."},
        {"name": "Postre de Natas", "base_price": 12000, "category": "Postres", "description": "Delicioso postre tradicional de natas."},
        {"name": "Picada Familiar", "base_price": 85000, "category": "Para Compartir", "description": "Variedad de carnes, papas, arepas y plátano para compartir."},
        {"name": "Gaseosa 1.5L", "base_price": 10000, "category": "Bebidas", "description": "Gaseosa familiar de 1.5 litros."}
    ]
    
    print(f"Restoring {len(missing_products)} products to business {business_id}...")
    
    for prod in missing_products:
        item = {
            'id': str(uuid.uuid4()),
            'negocio_id': business_id,
            'name': prod['name'],
            'description': prod.get('description', ""),
            'base_price': prod['base_price'],
            'currency': "COP",
            'category': prod['category'],
            'available': True,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat()
        }
        
        try:
            res = supabase.table('menu_items').insert(item).execute()
            print(f"  - Restored '{prod['name']}' successfully.")
        except Exception as e:
            print(f"  - Error restoring '{prod['name']}': {e}")

if __name__ == "__main__":
    restore_products()
