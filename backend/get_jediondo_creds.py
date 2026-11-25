import os
import sys
import json
from dotenv import load_dotenv

# Let's import supabase client
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
load_dotenv('.env')

from supabase import create_client, Client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

res = supabase.table('negocios').select('nombre, email, slug').ilike('nombre', '%jediondo%').execute()

print(json.dumps(res.data, indent=2))
