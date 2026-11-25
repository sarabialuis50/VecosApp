import os
from supabase import create_client
from dotenv import load_dotenv
from datetime import datetime, timezone

load_dotenv()

url = os.environ.get('SUPABASE_URL')
key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(url, key)

# Check ALL OTPs for this phone, not filtering by used/expired
phone = "3128833350"
res = supabase.table('auth_otps').select('*').eq('telefono', phone).order('created_at', desc=True).limit(10).execute()

print(f"\n=== All OTPs for phone {phone} ===")
now = datetime.now(timezone.utc)
for r in res.data:
    print(f"  ID: {r['id']}")
    print(f"  Code: {r['otp_code']}")
    print(f"  Used: {r['used']}")
    print(f"  Expires: {r['expires_at']}")
    print(f"  Created: {r['created_at']}")
    print(f"  Still valid now? Checking expires_at vs {now.isoformat()}")
    print("---")
