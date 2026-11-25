import os
from supabase import create_client, Client
from dotenv import load_dotenv
import json

load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

try:
    res = supabase.table('pedidos').select('*').limit(1).execute()
    if res.data:
        with open("sample_order.json", "w", encoding="utf-8") as f:
            json.dump(res.data[0], f, indent=2)
        print("Saved to sample_order.json")
    else:
        print("No data in pedidos to check columns.")
except Exception as e:
    print(f"Error: {e}")
