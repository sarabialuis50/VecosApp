import os
import sys
from supabase import create_client, Client

# Add backend dir to path to import config if needed, or just use values from .env directly
# Since we are in /tmp, we can't easily import from backend/
# I'll just read the .env file manually or use the values I saw earlier.

SUPABASE_URL = "https://kgzbixgmunmbgzlegobb.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnemJpeGdtdW5tYmd6bGVnb2JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY2OTAxMiwiZXhwIjoyMDg2MjQ1MDEyfQ.zweOUsel0LQ3ayoeH8DFgMFQBL1pAq0gGBjVk5IWoJA"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def update_limits():
    print("Iniciando actualización de límites en la base de datos...")
    
    # 1. Actualizar específicamente a 'don-jediondo' que es el negocio del usuario
    try:
        res = supabase.table("businesses").update({"wa_credits_limit": 1500}).eq("slug", "don-jediondo").execute()
        if res.data:
            print(f"✅ ÉXITO: {res.data[0]['name']} (slug: don-jediondo) actualizado a 1.500 mensajes.")
        else:
            print("⚠️ No se encontró el negocio con slug 'don-jediondo'.")
    except Exception as e:
        print(f"❌ Error actualizando don-jediondo: {e}")

    # 2. Actualizar todos los negocios según su plan para que coincidan con la nueva oferta comercial
    try:
        businesses = supabase.table("businesses").select("id, slug, name, subscription_plan").execute()
        for biz in businesses.data:
            plan = (biz.get("subscription_plan") or "").lower()
            new_limit = 0
            
            # Mapeo de planes
            if "basico" in plan or "impulso" in plan or not plan: 
                new_limit = 1500
            elif "pro" in plan: 
                new_limit = 4500
            elif "premium" in plan or "elite" in plan: 
                new_limit = 9000
                
            if new_limit > 0:
                supabase.table("businesses").update({"wa_credits_limit": new_limit}).eq("id", biz["id"]).execute()
                print(f"✅ {biz['name']} ({biz['slug']}) -> {new_limit} mensajes.")
    except Exception as e:
        print(f"❌ Error actualizando otros negocios: {e}")

if __name__ == "__main__":
    update_limits()
