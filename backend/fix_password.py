import bcrypt
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

email = "sarabialuis50@gmail.com"
new_password = "password123"
new_hash = hash_password(new_password)

print(f"Updating password for {email}...")
res = supabase.table('negocios').update({"password_hash": new_hash}).eq('email', email).execute()

if res.data:
    print("SUCCESS: Password updated!")
else:
    print("FAILED: User not found or update error.")
