"""Fix server.py with correct platform routing logic"""

PLATFORM_BIZ_ID = "f92dc309-3b2b-4ddd-b8c6-723de6da38f3"

# Lines to replace: start at line 2124 (0-indexed: 2123)
# We replace until the line before 'if business_data:' which is line 2188 approx
# Let's find the right end line dynamically

with open('server.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")

# Find the start line: "# 1. Identificar el negocio"
start_line = None
for i, line in enumerate(lines):
    if '# 1. Identificar el negocio' in line:
        start_line = i
        break

# Find end line: "if business_data:" after the start
end_line = None
for i in range(start_line, min(start_line + 80, len(lines))):
    if 'if business_data:' in lines[i] and i > start_line + 5:
        end_line = i
        break

print(f"Replacing lines {start_line+1} to {end_line} (0-indexed: {start_line} to {end_line-1})")
print("Sample lines being replaced:")
for i in range(start_line, min(start_line+5, end_line)):
    print(f"  {i+1}: {repr(lines[i][:80])}")

NEW_BLOCK = f'''        # 1. Identificar el negocio
        to_number_raw = data_dict.get('To', '')
        to_number = to_number_raw.replace('whatsapp:', '')
        
        from whatsapp_agent import GLOBAL_TWILIO_NUMBER
        
        PLATFORM_BIZ_ID = "{PLATFORM_BIZ_ID}"
        clean_to = to_number.replace('+', '')
        clean_official = GLOBAL_TWILIO_NUMBER.replace('whatsapp:', '').replace('+', '')
        is_official_number = (clean_to == clean_official)
        
        business_data = None
        print(f"DEBUG: to={{to_number}}, official={{GLOBAL_TWILIO_NUMBER}}, is_official={{is_official_number}}")
        
        if is_official_number:
            # Número oficial de la plataforma:
            # Buscar si el usuario es cliente activo de algún restaurante (conversación reciente)
            # Solo consideramos conversaciones de las últimas 48 horas con negocios reales
            from datetime import datetime, timezone, timedelta
            cutoff = (datetime.now(timezone.utc) - timedelta(hours=48)).isoformat()
            
            # Buscamos conversaciones recientes excluyendo la plataforma misma
            # y solo conversaciones del canal WhatsApp (no web_)
            conv_res = supabase.table('agent_conversations') \\
                .select('negocio_id, last_message_at') \\
                .eq('phone_number', sender_phone) \\
                .neq('negocio_id', PLATFORM_BIZ_ID) \\
                .gte('last_message_at', cutoff) \\
                .order('last_message_at', desc=True) \\
                .limit(1) \\
                .execute()
            
            if conv_res.data:
                # El usuario tiene conversación activa con un restaurante
                neg_id_found = conv_res.data[0]['negocio_id']
                biz_res = supabase.table('negocios').select('*').eq('id', neg_id_found).execute()
                if biz_res.data:
                    business_data = biz_res.data[0]
                    negocio_id = business_data['id']
                    print(f"Usuario {{sender_phone}} es cliente activo de {{business_data.get('nombre')}}")
            
            if not business_data:
                # Usuario nuevo o sin conversación activa → Modo Plataforma
                print(f"Modo PLATFORM para {{sender_phone}} (nuevo usuario o sin negocio activo)")
                negocio_id = PLATFORM_BIZ_ID
        else:
            # Número de whatsapp de un negocio específico
            biz_res = supabase.table('negocios').select('*').eq('whatsapp', to_number).execute()
            if biz_res.data:
                business_data = biz_res.data[0]
                negocio_id = business_data['id']
            else:
                print(f"No se encontró negocio para: {{to_number}}")
                return {{"status": "error", "reason": "no_business_linked"}}
        
'''

new_lines = lines[:start_line] + [NEW_BLOCK] + lines[end_line:]

with open('server.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Total lines after: {len(new_lines)}")

# Verify
with open('server.py', 'r', encoding='utf-8') as f:
    verify = f.read()
if "cliente activo" in verify and "Modo PLATFORM" in verify:
    print("SUCCESS: Logic updated correctly!")
else:
    print("WARNING: Verification failed!")
