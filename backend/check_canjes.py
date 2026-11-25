import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def check_canjes():
    try:
        res = supabase.table('canjes_puntos').select('id').limit(1).execute()
        print("Table canjes_puntos EXISTS")
    except:
        print("Table canjes_puntos DOES NOT EXIST")
    
    try:
        # Get all table names from database
        # This rpc call was guessed, but let's try a different approach if it fails
        pass

if __name__ == "__main__":
    check_canjes()
