import os, sys
from dotenv import load_dotenv
load_dotenv()

from supabase import create_client

url = os.environ.get("SUPABASE_URL", "")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")

supabase = create_client(url, key)

res_bus = supabase.table('negocios').select('id').eq('slug', 'don-jediondo').execute()
negocio_id = res_bus.data[0]['id']
print(f"negocio_id={negocio_id}")

res_emp = supabase.table('empleados').select('*').eq('negocio_id', negocio_id).execute()
print(f"empleados={len(res_emp.data)}")

for e in res_emp.data:
    pin = e.get('pin')
    activo = e.get('activo')
    nombre = e.get('nombre')
    print(f"---")
    print(f"nombre={nombre}")
    print(f"pin={repr(pin)} type={type(pin).__name__}")
    print(f"activo={repr(activo)} type={type(activo).__name__}")
    
    # Test match exactly as login does
    clean_pin = str(pin).strip()
    test = supabase.table('empleados').select('id').match({
        "negocio_id": negocio_id,
        "pin": clean_pin,
        "activo": True
    }).execute()
    print(f"match(str,bool)={len(test.data)}")
    
    # Try int
    try:
        test2 = supabase.table('empleados').select('id').match({
            "negocio_id": negocio_id,
            "pin": int(clean_pin),
            "activo": True
        }).execute()
        print(f"match(int,bool)={len(test2.data)}")
    except:
        print("int match failed")
    
    # Try eq chain
    test3 = supabase.table('empleados').select('id').eq('negocio_id', negocio_id).eq('pin', clean_pin).eq('activo', True).execute()
    print(f"eq_chain(str)={len(test3.data)}")
