import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get('SUPABASE_URL')
key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(url, key)

res = supabase.table('agent_messages').select('*').order('created_at', desc=True).limit(5).execute()
for m in res.data:
    print(f"{m['created_at']} - {m['direction']} - {m['content']}")
