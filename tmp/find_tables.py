import os
from supabase import create_client, Client

SUPABASE_URL = "https://kgzbixgmunmbgzlegobb.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnemJpeGdtdW5tYmd6bGVnb2JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY2OTAxMiwiZXhwIjoyMDg2MjQ1MDEyfQ.zweOUsel0LQ3ayoeH8DFgMFQBL1pAq0gGBjVk5IWoJA")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

try:
    res = supabase.rpc("get_tables").execute()
    print(res.data)
except:
    # Si no hay RPC, probamos consulta directa a information_schema
    try:
        res = supabase.postgrest.request("GET", "/rest/v1/", params={"select": "*"}, headers={"Accept": "application/json"}).execute()
        # Esto no suele funcionar. Mejor usamos .table_name que sabemos que falla si no existe.
        pass
    except:
        pass

# Usaré una consulta SQL vía rpc si existe o simplemente probaré nombres comunes
test_names = ["negocios", "businesses", "restaurantes", "shops"]
for name in test_names:
    try:
        res = supabase.table(name).select("*").limit(1).execute()
        print(f"✅ Tabla '{name}' existe.")
    except Exception as e:
        print(f"❌ Tabla '{name}' no existe o error: {e}")
