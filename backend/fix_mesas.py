import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

def fix_mesas_table():
    print("Adding 'ubicacion' column to 'mesas' table...")
    # SQL to add column if not exists
    sql = """
    DO $$ 
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mesas' AND column_name='ubicacion') THEN
            ALTER TABLE mesas ADD COLUMN ubicacion TEXT;
        END IF;
    END $$;
    """
    
    # We can't execute raw SQL easily via python client without rpc or specific setup.
    # But usually we can use .rpc() if we have a function. If not, we rely on the user running SQL.
    # HOWEVER, we can try to use the 'rest' interface if enabled? No.
    
    # Actually, we can just use the provided SQL script from previous steps. 
    # But the user mentioned "no deja crear mesas".
    
    print("Cannot execute raw SQL from Python client directly without RPC.")
    print("Please run the following SQL in Supabase SQL Editor:")
    print(sql)

if __name__ == "__main__":
    fix_mesas_table()
