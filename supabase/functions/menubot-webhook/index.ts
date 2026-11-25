
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import twilio from "https://esm.sh/twilio@4.19.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- REUSABLE TWILIO CLIENT ---
const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID_MENU_IA') || Deno.env.get('TWILIO_ACCOUNT_SID');
const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN_MENU_IA') || Deno.env.get('TWILIO_AUTH_TOKEN');
const twilioFrom = Deno.env.get('TWILIO_WHATSAPP_FROM_MENU_IA') || Deno.env.get('TWILIO_WHATSAPP_NUMBER');

const client = twilio(twilioSid, twilioToken);

export async function sendWhatsAppMessage(to: string, body: string) {
  return client.messages.create({
    from: twilioFrom,
    to: `whatsapp:${to}`,   // número en formato +57...
    body,
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse payload (Twilio uses form-urlencoded)
    const contentType = req.headers.get("content-type") || "";
    let payload: any = {};

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

    const rawPhone = payload.from || "";
    const cleanPhone = rawPhone.replace("whatsapp:", "").trim();

    if (!cleanPhone || !payload.body) {
      return new Response(JSON.stringify({ error: "Missing data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`Mensaje recibido de ${cleanPhone}: ${payload.body}`);

    // --- LOGICA Fase 2: Responder usando la API de Twilio ---
    const responseText = `¡Hola! Recibí tu mensaje: "${payload.body}". Pronto estaré listo para tomar tu pedido. 🤖`;

    await sendWhatsAppMessage(cleanPhone, responseText);

    // Retornamos un XML vacío o simple para confirmar a Twilio que recibimos el mensaje
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/xml" }
      }
    );

  } catch (error) {
    console.error("Error en Webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
})

