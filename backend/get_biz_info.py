import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def get_business_info():
    res = supabase.table('businesses').select('*').eq('slug', 'don-jediondo').execute()
    print("Business info:", res.data)

if __name__ == "__main__":
    get_business_info()
