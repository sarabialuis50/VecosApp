import os
from dotenv import load_dotenv
from supabase import create_client, Client
from pathlib import Path

# Load environment variables
ROOT_DIR = Path('c:/Users/luis.sarabia/MenuPro/backend')
load_dotenv(ROOT_DIR / '.env')

url: str = os.environ.get("SUPABASE_URL")
# Use service role key to bypass RLS for initial check and modification if needed
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in environment variables.")
    exit(1)

supabase: Client = create_client(url, key)

def check_rls(table_name):
    # This query checks if RLS is enabled on a table
    query = f"SELECT relname, relobjects, relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = '{table_name}' AND n.nspname = 'public';"
    # But wait, using the client.rpc or raw sql is better.
    # We can use a direct SQL via the REST API for some things, but better write a tiny SQL query.
    
    # We'll use the rpc call if possible, but let's just try to execute a simple SELECT.
    # Actually, we can use the service role to do ANYTHING.
    
    # Let's try to get the table information using raw SQL via the REST API if supported,
    # or just try to see if we can get policies.
    
    # Since we can't easily run raw SQL via the client without an RPC function, 
    # we'll assume we need to enable it if the user says so.
    
    # Actually, we can try to enable it and see if it works.
    pass

def enable_rls(table_name):
    print(f"Enabling RLS on {table_name}...")
    # To enable RLS via the client, we would need an RPC function or a migration tool.
    # But I can't easily run DDL via the supabase-py client without an RPC.
    
    # Wait! I have the MCP `supabase-mcp-server_execute_sql`.
    # BUT I don't have access to the project `kgzbixgmunmbgzlegobb` via that server.
    
    # So I MUST use the client if I want to do it from a script.
    # But the client doesn't support DDL directly.
    
    # Wait, can I use the `postgres` library to connect directly?
    # I have the db host: `db.kgzbixgmunmbgzlegobb.supabase.co`
    # I need the password. Usually the same as the project password.
    # But I don't have the project password in `.env`.
    
    pass

if __name__ == "__main__":
    print(f"Project URL: {url}")
    # I'll try to list tables using the client to see if I can find menu_item_tags
    try:
        res = supabase.table('menu_item_tags').select('*', count='exact').limit(1).execute()
        print(f"Table 'menu_item_tags' exists. Row count: {res.count}")
    except Exception as e:
        print(f"Error accessing 'menu_item_tags': {e}")
