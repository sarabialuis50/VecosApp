import os
import json
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

supabase = create_client(url, key)

try:
    res = supabase.table('menu_items').select('*').limit(1).execute()
    if res.data:
        print("M", json.dumps(list(res.data[0].keys())))
    else:
        print("No items M")
except Exception as e:
    print("Error M", str(e))
