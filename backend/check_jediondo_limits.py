import os
import json
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(r'c:\Users\luis.sarabia\MenuPro\backend\.env')
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

res = supabase.table('negocios').select('plan, whatsapp_incluidos, whatsapp_usados').eq('slug', 'don-jediondo').execute()
print(json.dumps(res.data))
