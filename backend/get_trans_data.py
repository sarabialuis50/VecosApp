import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def get_trans_data():
    try:
        res = supabase.table('transacciones_puntos').select('*').limit(1).execute()
        if res.data:
            print("Full Transaction Data:", res.data[0])
        else:
            print("N/A")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    get_trans_data()
