Problemas Conocidos y Soluciones - Menu.IA
Este documento contiene todos los problemas descubiertos durante el desarrollo y sus soluciones. Lee esto antes de debuggear.

Checklist Rápido Pre-Producción
text
□ Supabase Secrets configurados (4 secrets)
□ Webhook URL en Twilio sandbox
□ Usuario unido al sandbox de Twilio
□ Edge Functions desplegadas CON contenido (verificar)
□ Base de datos con seed data (categorías, platos, mesas)
□ Frontend corriendo (npm run dev)
Problemas de Twilio
1. Twilio envía form-urlencoded, no JSON
Problema: El webhook espera JSON pero Twilio envía application/x-www-form-urlencoded.

Solución: Detectar Content-Type y parsear según el formato:

typescript
const contentType = req.headers.get("content-type") || "";
if (contentType.includes("application/json")) {
  payload = await req.json();
} else if (contentType.includes("application/x-www-form-urlencoded")) {
  const rawBody = await req.text();
  const params = new URLSearchParams(rawBody);
  payload = {
    from: params.get("From") || "",
    body: params.get("Body") || "",
  };
}
2. Prefijo whatsapp: en números
Problema: Twilio añade whatsapp: a los números, causando duplicados en la base de datos.

Solución: Normalizar SIEMPRE antes de guardar:

typescript
function normalizePhone(phone: string): string {
  return phone.replace("whatsapp:", "").trim();
}
3. Auth Token desactualizado
Problema: Twilio regenera tokens y el viejo deja de funcionar.

Solución: Verificar en Twilio Console que el Auth Token en Supabase esté actualizado.

4. Mensajes no llegan a WhatsApp
Causas comunes:

Usuario no está unido al sandbox (debe enviar "join xxx" primero)

Número en formato incorrecto (debe incluir whatsapp:+...)

Secrets no configurados en Supabase

Diagnóstico: Agregar logs en el webhook:

typescript
console.log("=== TWILIO DIAGNOSTIC ===");
console.log("TWILIO_ACCOUNT_SID configured:", !!twilioAccountSid);
console.log("TWILIO_AUTH_TOKEN configured:", !!twilioAuthToken);
console.log("TWILIO_WHATSAPP_NUMBER:", twilioWhatsAppNumber);
Problemas de Edge Functions
5. Funciones desplegadas vacías
Problema: El deploy devuelve código 200 pero el archivo index.ts está vacío en producción. Menu.IA Bot no responde.

Síntomas:

Mensajes se guardan en la base de datos

Webhook devuelve 200

Menu.IA Bot no genera respuestas

Solución:

Verificar contenido con get_edge_function (el campo content debe tener código)

Redesplegar la función con el código completo

6. CORS bloqueando peticiones del Dashboard
Problema: El navegador bloquea peticiones al Edge Function con error 405.

Solución: Manejar OPTIONS al inicio de la función:

typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  // ... resto de la lógica
});
7. Múltiples instancias de Supabase Client
Problema: Durante hot reload se crean múltiples conexiones.

Solución: Usar patrón Singleton:

typescript
let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key, options);
  }
  return supabaseInstance;
};
Problemas de OpenAI Function Calling
8. OpenAI no llama funciones cuando debería
Problema: OpenAI genera texto conversacional en lugar de ejecutar funciones, incluso cuando el usuario confirma su pedido.

Solución: Detectar keywords de confirmación y forzar la llamada:

typescript
const confirmationKeywords = ["confirmo", "sí", "si", "pedido", "confirmar", "listo"];
const isConfirming = confirmationKeywords.some(keyword =>
  message.toLowerCase().includes(keyword)
);

if (isConfirming) {
  forceFunctionCall = { name: "create_order" };
}

// En la llamada a OpenAI
body: JSON.stringify({
  // ...
  function_call: forceFunctionCall, // "auto" o { name: "..." }
})
9. dish_id mal interpretado
Problema: OpenAI usa "1", "2" o nombres de platos en lugar del UUID.

Solución:

Validar server-side:

typescript
if (dish_id && dish_id.length < 10) {
  return { error: "ID de plato inválido. Usa el UUID completo." };
}
Devolver dish_id duplicado en get_menu_items:

typescript
return {
  menu_items: dishes.map((dish) => ({
    dish_id: dish.id,  // ← Para create_order
    id: dish.id,       // ← Compatibilidad
    name: dish.name,
    price: dish.price,
  }))
};
10. Respuestas vacías de OpenAI
Problema: OpenAI ejecuta la función pero no genera mensaje de confirmación del pedido.

Solución: Fallback final si no hay texto:

typescript
if (!assistantMessage.trim()) {
  const finalRes = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [...history, {
      role: "system",
      content: "El pedido se procesó correctamente. Confirma al cliente amigablemente con el resumen."
    }]
  });
  assistantMessage = finalRes.choices[0].message.content;
}
Problemas de Fechas y Datos
11. Fecha incorrecta en pedidos
Problema: El LLM usa fechas pasadas si no tiene la fecha actual.

Solución: Inyectar fecha en el systemPrompt:

typescript
const now = new Date();
const formattedNow = now.toLocaleDateString('es-MX', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});
const systemPrompt = `HOY ES: ${formattedNow}. Usa el año ${now.getFullYear()}.`;
12. Formato de fechas inválido para entrega
Problema: Fechas en formato incorrecto causan errores.

Solución: Validar con regex antes de procesar:

typescript
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
if (!delivery_date && dateRegex.test(delivery_date)) {
  return {
    error: "Formato de fecha inválido. Use YYYY-MM-DD (ejemplo: 2026-02-15)"
  };
}
13. Nombre genérico del cliente
Problema: Se crean pedidos con nombres como "Cliente 1052".

Solución: Instrucción en el systemPrompt:

text
ANTES de crear el pedido, SIEMPRE pregunta por el nombre completo
si el nombre actual es genérico (ej: "Cliente 1052").
Problemas de Base de Datos
14. Conflictos de mesas no detectados
Problema: La query SQL con .lte()/.gte() no funciona correctamente para reservas de mesa.

Solución: Filtrar manualmente en JavaScript:

typescript
const conflictingReservations = allReservations?.filter((res) => {
  const resStart = new Date(res.order_time);
  const resEnd = new Date(res.order_time);
  resEnd.setMinutes(resEnd.getMinutes() + res.duration_minutes);
  return (
    (orderTime >= resStart && orderTime < resEnd) ||
    (orderTime + duration_minutes > resStart && orderTime + duration_minutes <= resEnd)
  );
}) || [];
15. Registros duplicados de clientes
Problema: Se crean clientes con y sin prefijo whatsapp:.

Solución:

Normalizar número SIEMPRE antes de guardar

Limpiar duplicados:

sql
DELETE FROM messages WHERE customer_id = 'id_del_duplicado';
DELETE FROM customers WHERE phone LIKE 'whatsapp:%';
Problemas de Frontend
16. Mensajes no aparecen en tiempo real
Problema: Nuevos mensajes no se muestran automáticamente.

Solución: Combinar polling + suscripción:

typescript
// Polling
const { data } = useQuery({
  queryKey: ['messages'],
  refetchInterval: 2000,
});

// Suscripción
const channel = supabase
  .channel('messages_realtime')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
    queryClient.invalidateQueries({ queryKey: ['messages'] });
  })
  .subscribe();
17. Token de sesión no funciona con Edge Functions
Problema: session.access_token no autoriza las llamadas.

Solución: Usar VITE_SUPABASE_ANON_KEY directamente:

typescript
const response = await fetch(`${supabaseUrl}/functions/v1/menubot-agent`, {
  headers: {
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  },
});
Debugging
18. LOGGING OBLIGATORIO
Toda función crítica debe incluir logs:

typescript
console.log("Creating order with:", { dish_ids, quantities, customerId });
console.log("Function result:", JSON.stringify(functionResult).substring(0, 200));
console.error("Menu error:", menuError);
19. Dónde revisar logs
Edge Functions: Supabase Dashboard → Settings → Edge Functions → Logs

Twilio: Twilio Console → Monitor → Logs

Frontend: Console del navegador (F12)

20. JSON.stringify para objetos
Los objetos complejos no se muestran bien en logs:

typescript
console.log("Data:", JSON.stringify(data, null, 2));
Validaciones
21. Validar existencia de entidades
Antes de crear relaciones, verificar que existan:

typescript
const { data: dish, error } = await supabase
  .from('dishes')
  .select('id')
  .eq('id', dish_id)
  .single();

if (error || !dish) {
  return { error: "Plato no encontrado" };
}
22. Errores descriptivos
En lugar de errores genéricos, ser específico:

typescript
// MAL
return { error: "Error" };

// BIEN
return {
  error: "Plato no disponible. Elige otro de la lista."
};
Resumen de Errores Comunes
Error	Causa Probable	Solución
"Twilio credentials not configured"	Secrets faltantes	Agregar los 4 secrets en Supabase
Menu.IA Bot no responde	Edge Function vacía	Verificar y redesplegar
Mensaje no llega a WhatsApp	Usuario no en sandbox	Enviar "join xxx" primero
Error 405 en Dashboard	CORS no configurado	Agregar manejo de OPTIONS
Pedido con fecha 2024	Fecha no inyectada	Agregar fecha actual al prompt
dish_id inválido	OpenAI usando índices	Validar longitud > 10
