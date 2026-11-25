import os
from supabase import create_client, Client

SUPABASE_URL = "https://kgzbixgmunmbgzlegobb.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnemJpeGdtdW5tYmd6bGVnb2JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY2OTAxMiwiZXhwIjoyMDg2MjQ1MDEyfQ.zweOUsel0LQ3ayoeH8DFgMFQBL1pAq0gGBjVk5IWoJA")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

try:
    res = supabase.table("negocios").select("*").limit(1).execute()
    if res.data:
        cols = sorted(list(res.data[0].keys()))
        print(f"COLUMNAS: {cols}")
except Exception as e:
    print(f"Error: {e}")
