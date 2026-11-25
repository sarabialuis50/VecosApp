import os
from supabase import create_client, Client

SUPABASE_URL = "https://kgzbixgmunmbgzlegobb.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnemJpeGdtdW5tYmd6bGVnb2JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY2OTAxMiwiZXhwIjoyMDg2MjQ1MDEyfQ.zweOUsel0LQ3ayoeH8DFgMFQBL1pAq0gGBjVk5IWoJA")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def update_db():
    print("🚀 Iniciando actualización masiva de límites de WhatsApp...")
    
    # Mapeo de límites según el plan
    # Basado en lo solicitado: Básico (1500), Pro (4500), Premium (9000)
    LIMITS = {
        "basico": 1500,
        "pro": 4500,
        "premium": 9000,
        "free": 1500, # Trial behaves like basic
        "trial": 1500
    }

    try:
        # 1. Obtener todos los negocios
        res = supabase.table("negocios").select("id, nombre, slug, plan").execute()
        businesses = res.data
        
        updated_count = 0
        for biz in businesses:
            plan_key = (biz.get("plan") or "basico").lower()
            new_limit = LIMITS.get(plan_key, 1500)
            
            # Actualizar
            supabase.table("negocios").update({"whatsapp_incluidos": new_limit}).eq("id", biz["id"]).execute()
            print(f"✅ {biz['nombre']} ({biz['slug']}) | Plan: {plan_key} -> Limite: {new_limit}")
            updated_count += 1
            
        print(f"\n✨ Proceso finalizado. {updated_count} negocios actualizados.")
        
    except Exception as e:
        print(f"❌ Error durante la actualización: {e}")

if __name__ == "__main__":
    update_db()
