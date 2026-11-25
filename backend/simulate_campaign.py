import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def run_simulation():
    # 1. Get a business
    biz_res = supabase.table('negocios').select('*').limit(1).execute()
    if not biz_res.data:
        print("No hay negocios para probar.")
        return
    
    biz = biz_res.data[0]
    print(f"--- SIMULACIÓN DE CAMPAÑA PARA: {biz['nombre']} ---")
    print(f"Plan actual: {biz['plan']}")
    print(f"Créditos iniciales: {biz.get('wa_credits', 0)}")

    # 2. Ensure credits
    if (biz.get('wa_credits') or 0) < 5:
        print("Añadiendo 50 créditos de prueba...")
        supabase.table('negocios').update({"wa_credits": 50}).eq('id', biz['id']).execute()
        biz['wa_credits'] = 50

    # 3. Get customers
    cust_res = supabase.table('clientes_puntos').select('*').eq('negocio_id', biz['id']).limit(5).execute()
    customers = cust_res.data
    
    if not customers:
        print("No hay clientes en 'clientes_puntos'. Creando uno de prueba...")
        supabase.table('clientes_puntos').insert({
            "negocio_id": biz['id'],
            "nombre": "Cliente De Prueba",
            "telefono": "573001234567",
            "puntos_totales": 500
        }).execute()
        cust_res = supabase.table('clientes_puntos').select('*').eq('negocio_id', biz['id']).limit(5).execute()
        customers = cust_res.data

    count = len(customers)
    print(f"Audiencia seleccionada: {count} clientes.")
    
    # 4. Simulate Deduction
    new_credits = biz['wa_credits'] - count
    print(f"Descontando {count} créditos...")
    supabase.table('negocios').update({"wa_credits": new_credits}).eq('id', biz['id']).execute()
    
    # 5. Simulate Sending
    message_template = "¡Hola [Nombre]! 👋 Tienes [Puntos] puntos en [Negocio]. ¡Ven a canjearlos hoy!"
    print("\nPROCESANDO ENVÍO (Simulado):")
    for c in customers:
        msg = message_template.replace("[Nombre]", c['nombre']).replace("[Puntos]", str(c['puntos_totales'])).replace("[Negocio]", biz['nombre'])
        print(f"   => Envíando a {c['telefono']}: \"{msg[:60]}...\"")
    
    print(f"\n--- SIMULACIÓN COMPLETADA ---")
    print(f"Créditos finales en Supabase: {new_credits}")

if __name__ == "__main__":
    run_simulation()
