import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def check_schema():
    # Check tables
    res = supabase.rpc('get_tables', {}).execute()
    print("Tables:", res.data)

    # Check columns of clientes_puntos
    res = supabase.table('clientes_puntos').select('*').limit(1).execute()
    if res.data:
        print("Sample data from clientes_puntos:", res.data[0].keys())
    else:
        print("No data in clientes_puntos or table not found")

    # Check for foreign keys
    query = """
    SELECT
        tc.table_name, kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
    FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
    WHERE constraint_type = 'FOREIGN KEY' AND ccu.table_name='clientes_puntos';
    """
    # We can't easily run raw SQL via the client unless we use a function
    # But we can try to find other tables and see their structure
    tables = ['transacciones_puntos', 'canjes', 'beneficios']
    for t in tables:
        try:
            r = supabase.table(t).select('*').limit(0).execute()
            print(f"Table {t} exists")
        except:
             print(f"Table {t} does not exist or error")

if __name__ == "__main__":
    check_schema()
