# 🤖 Menu.IA — Agentes de Inteligencia Artificial

<div align="center">

**Agente WhatsApp (OpenAI) + Agente Analítico (Google Gemini)**
*Automatización de pedidos por WhatsApp e insights inteligentes para dueños de restaurantes*

</div>

---

## 📋 Descripción General

Menu.IA integra **dos agentes de IA** que potencian la operación de los restaurantes:

| Agente | Motor IA | Canal | Propósito |
|--------|----------|-------|-----------|
| **Menu.IA Bot** | OpenAI GPT-4o-mini | WhatsApp (Twilio) | Toma de pedidos conversacional, menú digital y seguimiento de órdenes |
| **Menu.IA Insights** | Google Gemini 1.5 Flash | Dashboard Web | Análisis de datos del negocio y recomendaciones estratégicas para el dueño |

---

## 🟢 AGENTE 1: Menu.IA Bot WhatsApp (OpenAI)

### 🎯 Objetivos
- Mostrar el menú digital del negocio de forma clara (categorías, platos, precios, disponibilidad).
- Tomar pedidos de forma conversacional, incluyendo cantidades, variaciones y notas especiales.
- Gestionar tipo de servicio: mesa, para llevar o domicilio.
- Responder preguntas frecuentes sobre ingredientes, horarios y tiempos de entrega.
- Enviar notificaciones transaccionales (confirmación, estado del pedido, listo para recoger).
- Consultar estado de pedidos existentes por teléfono del cliente.
- **Detección Automática de Canal:** El agente decide si abrir un link de WhatsApp o mostrar un Modal de Chat Web según la configuración del negocio.

### 💰 Monetización y Cobro de Créditos
El sistema gestiona el uso de IA y notificaciones mediante créditos:
- **Sesión IA (Web):** 1 crédito por inicio de sesión (cubre uso ilimitado de IA en el modal).
- **Interacción IA (WhatsApp):** 1 crédito por cada respuesta de la IA (cubre costos de Twilio + OpenAI).
- **Pedido vía IA:** 3 créditos total (Sesión/Interacción + 2 notificaciones WhatsApp).
- **Pedido vía Carrito:** 2 créditos (Solo las 2 notificaciones WhatsApp).
- **Alertas:** Notificaciones automáticas al dueño por saldo bajo (50 msjs) o servicio agotado.

### 🧠 Arquitectura

```
┌──────────────────────────────────────────────────────────────────┐
│                     MENU.IA BOT WHATSAPP AGENT                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐   ┌───────────────┐   ┌──────────────────┐    │
│  │   Twilio      │──▶│   Supabase    │──▶│   Intent         │    │
│  │   WhatsApp    │   │   Edge Fn     │   │   Classifier     │    │
│  │   Webhook     │   │   (webhook)   │   │   (OpenAI)       │    │
│  └──────────────┘   └───────────────┘   └────────┬─────────┘    │
│                                                   │              │
│  ┌──────────────┐   ┌───────────────┐   ┌────────▼─────────┐    │
│  │   Twilio      │◀──│   Response    │◀──│   Function       │    │
│  │   Send Msg    │   │   Generator   │   │   Calling        │    │
│  └──────────────┘   └───────────────┘   │   (Supabase DB)  │    │
│                                          └──────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 💬 Casos de Uso Principales

#### 1. Ver el Menú
```
Cliente: "Quiero ver el menú"

Agente: "👋 ¡Hola, María!
Este es el menú de *Cafetería El Buen Sabor*:

🥐 Desayunos
1. Café americano — $8.000
2. Croissant de mantequilla — $7.000

🍲 Almuerzos
3. Sopa del día — $10.000
4. Pasta bolognesa — $18.000

Responde con el número del plato o su nombre para más detalles."
```

#### 2. Detalle de un Plato
```
Cliente: "Cuéntame del 4"

Agente: "🍝 *Pasta bolognesa*
• Ingredientes: pasta, salsa de tomate, carne molida, queso parmesano
• Porción: 350g
• Precio: $18.000
• Tiempo estimado: 20–25 min

¿Quieres agregarla a tu pedido?"
```

#### 3. Creación de Pedido
```
Cliente: "Pon 2 pastas y 1 croissant"

Agente: "✅ Perfecto, María.

Tu pedido hasta ahora:
• 2x Pasta bolognesa — $36.000
• 1x Croissant de mantequilla — $7.000

Total parcial: $43.000

¿Es para *recoger en el local*, *domicilio* o *consumir en mesa*?"
```

#### 4. Confirmación y Estado
```
Agente: "🧾 *Resumen de tu pedido, María*:

• 2x Pasta bolognesa — $36.000
• 1x Croissant — $7.000

Total: $43.000 | Tipo: Domicilio
Dirección: Calle 123 #45-67, Apto 302

Responde *CONFIRMAR* para procesar o *EDITAR* para cambios."

---

Agente: "👨‍🍳 *Tu pedido está en preparación.*
⏱️ Tiempo estimado: 20–25 minutos.
Te avisaré cuando esté listo. 🙌"
```

### 🔧 Componentes del Sistema

#### Message Handler
Recibe y procesa mensajes entrantes de Twilio (texto, botones).

```typescript
interface IncomingMessage {
  from: string;            // Número de teléfono (normalizado, sin prefijo whatsapp:)
  body: string;            // Contenido del mensaje
  timestamp: Date;
  businessId?: string;     // ID del restaurante (negocio_id UUID)
}
```

> ⚠️ **Gotcha Twilio:** Twilio envía `application/x-www-form-urlencoded`, NO JSON. Ver `Gatchas.md #1`.
> ⚠️ **Gotcha Twilio:** Normalizar SIEMPRE el prefijo `whatsapp:` antes de guardar. Ver `Gatchas.md #2`.

#### Intent Classifier (OpenAI Function Calling)

```typescript
type Intent =
  | 'view_menu'             // Ver menú completo o por categoría
  | 'dish_details'          // Detalles de un plato
  | 'create_order'          // Crear pedido
  | 'update_order'          // Modificar pedido en curso
  | 'cancel_order'          // Cancelar pedido
  | 'order_status'          // Consultar estado de un pedido
  | 'greeting'              // Saludo inicial
  | 'help'                  // Pedir ayuda
  | 'faq'                   // Preguntas frecuentes (horarios, dirección, etc.)
  | 'unknown';              // No reconocido
```

> ⚠️ **Gotcha OpenAI:** OpenAI a veces no llama funciones cuando debería. Se debe forzar el `function_call` cuando se detectan keywords de confirmación. Ver `Gatchas.md #8`.
> ⚠️ **Gotcha OpenAI:** `dish_id` puede ser interpretado como "1", "2" en vez del UUID. Validar longitud > 10 siempre. Ver `Gatchas.md #9`.

#### Conversation Manager
Gestiona el estado de la conversación y el "carrito" actual del cliente.

```typescript
interface ConversationState {
  sessionId: string;
  customerId: string;
  businessId: string | null;
  currentIntent: Intent | null;
  awaitingResponse: boolean;
  context: {
    lastMessage: string;
    pendingAction: 'confirm_order' | 'ask_address' | 'ask_service_type' | 'confirm_cancel' | null;
    cart: {
      dishId: string;     // UUID del producto (tabla `productos`)
      name: string;
      quantity: number;
      unitPrice: number;
    }[];
    serviceType?: 'pickup' | 'delivery' | 'dine_in';
    address?: string;
    notes?: string;
    activeOrderId?: string;
  };
  history: Message[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### Action Executor
Ejecuta acciones contra la base de datos **Supabase** usando las tablas existentes del proyecto.

```typescript
interface Menu.IABotActions {
  // Consultas — Tablas: productos, pedidos
  getMenu(businessId: string): Promise<Product[]>;                     // tabla: productos
  getDishById(dishId: string): Promise<Product | null>;                // tabla: productos
  getActiveOrder(customerPhone: string): Promise<Order | null>;        // tabla: pedidos
  getOrderStatus(orderId: string): Promise<string>;                    // tabla: pedidos

  // Operaciones de pedido — Tabla: pedidos
  createOrder(payload: {
    negocio_id: string;
    cliente_nombre: string;
    cliente_telefono: string;
    tipo_pedido: 'online' | 'mesa' | 'takeaway' | 'delivery';
    mesa_numero?: number;
    items: { id: string; nombre: string; cantidad: number; precio: number }[];
    total: number;
    notas?: string;
  }): Promise<{ orderId: string; total: number }>;

  updateOrder(orderId: string, changes: Partial<Order>): Promise<Order>;
  cancelOrder(orderId: string): Promise<void>;

  // Notificaciones — WebSocket via ConnectionManager
  notifyKitchen(orderId: string, negocioId: string): Promise<void>;
  sendOrderStatusUpdate(customerPhone: string, orderId: string, status: string): Promise<void>;
}
```

#### Response Generator
Genera mensajes amigables y aptos para WhatsApp.

```typescript
interface ResponseTemplate {
  type: 'text' | 'buttons' | 'list';
  content: string;
  buttons?: { id: string; text: string }[];
  listSections?: { title: string; rows: { id: string; title: string; description?: string }[] }[];
  variables?: Record<string, string | number>;
}
```

### 🗄️ Tablas de Base de Datos (Agente WhatsApp)

El agente utiliza las tablas **existentes** del proyecto más dos tablas nuevas para el historial conversacional:

**Tablas existentes reutilizadas:**
- `negocios` — Datos del restaurante (slug, nombre, whatsapp).
- `productos` — Catálogo de productos con precios y disponibilidad.
- `pedidos` — Pedidos con estado, items (JSONB), tipo de pedido.
- `mesas` — Estado y número de mesas.

**Tablas nuevas requeridas:**

```sql
-- Conversaciones del agente WhatsApp
CREATE TABLE public.agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id UUID REFERENCES negocios(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'pending_human')),
  current_intent TEXT,
  context JSONB DEFAULT '{}',
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Historial de mensajes del agente
CREATE TABLE public.agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES agent_conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT DEFAULT 'text',
  content TEXT NOT NULL,
  intent TEXT,
  confidence DECIMAL(3,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 🔌 Integraciones

| Servicio | Proveedor | Uso |
|----------|-----------|-----|
| WhatsApp | Twilio Sandbox → WhatsApp Business API | Envío y recepción de mensajes |
| IA/NLP | OpenAI GPT-4o-mini | Clasificación de intenciones y Function Calling |
| Base de datos | Supabase (PostgreSQL) | Menú, pedidos, historial de conversaciones |
| Webhook | Supabase Edge Function | Punto de entrada para los mensajes de Twilio |
| Real-time | WebSockets (FastAPI) | Notificación instantánea a cocina |

### 🔑 Configuración de Identidad (Twilio Custom)
Los negocios pueden personalizar su remitente de WhatsApp:
- **Modo Global:** El sistema usa las credenciales generales de Menu.IA.
- **Modo Pro/Elite:** Permite al negocio ingresar su `twilio_sid`, `twilio_token` y `twilio_number` en su perfil para que todos los mensajes salgan desde su propio número corporativo.

### 📝 System Prompt del Agente WhatsApp

```
Eres Menu.IA, un asistente de WhatsApp para el restaurante {{business_name}}.

TU ROL:
- Mostrar el menú cuando lo pidan.
- Tomar pedidos de forma conversacional.
- Confirmar pedidos con resumen antes de procesar.
- Consultar el estado de pedidos existentes.

REGLAS OBLIGATORIAS:
- Habla siempre en español, tono cercano y profesional.
- NUNCA inventes platos ni precios. Usa solo datos reales de las funciones.
- SIEMPRE pide el nombre completo del cliente si el nombre actual es genérico.
- Para montos usa formato colombiano: $18.000.
- Si falta dirección (domicilio), pregúntala antes de confirmar.
- Si falta el tipo de servicio, pregúntalo.
- HOY ES: {{current_date}}. Usa siempre el año {{current_year}}.

FORMATO DE RESPUESTA:
- Respuestas cortas, máximo 6-7 líneas.
- Usa listas con viñetas para claridad.
- No uses código, JSON ni explicación técnica con el cliente.
```

### ⚠️ Gotchas Conocidos (Referencias → `Gatchas.md`)
- **#1:** Twilio envía form-urlencoded, NO JSON.
- **#2:** Normalizar prefijo `whatsapp:` antes de guardar.
- **#3:** Auth Token de Twilio puede caducar.
- **#5:** Edge Functions pueden desplegarse vacías. Siempre verificar.
- **#6:** Manejar CORS con OPTIONS en Edge Functions.
- **#8:** Forzar function_call en keywords de confirmación.
- **#9:** Validar dish_id (longitud > 10 para UUID).
- **#10:** Fallback si OpenAI no genera texto post-función.
- **#11:** Inyectar fecha actual en el systemPrompt.
- **#13:** Pedir nombre si es genérico.

---

## 🔵 AGENTE 2: Menu.IA Insights (Google Gemini)

### 🎯 Objetivos
Proporcionar al dueño del negocio un **panel de inteligencia artificial** en su dashboard (`/dashboard/[slug]/ia`) que analice los datos operativos y genere recomendaciones accionables.

### 🧠 Arquitectura

```
┌──────────────────────────────────────────────────────────────────┐
│                   MENU.IA INSIGHTS (GEMINI)                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐   ┌───────────────┐   ┌──────────────────┐    │
│  │   Dashboard   │──▶│   FastAPI     │──▶│   Data           │    │
│  │   Frontend    │   │   Endpoint    │   │   Aggregator     │    │
│  │   (React)     │   │   /api/gemini │   │   (Supabase)     │    │
│  └──────────────┘   └───────────────┘   └────────┬─────────┘    │
│                                                   │              │
│  ┌──────────────┐   ┌───────────────┐   ┌────────▼─────────┐    │
│  │   Dashboard   │◀──│   Response    │◀──│   Gemini 1.5     │    │
│  │   UI Cards    │   │   Parser      │   │   Flash API      │    │
│  └──────────────┘   └───────────────┘   └──────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 📊 Datos que Analiza

El agente consulta las siguientes tablas de Supabase para generar insights:

| Tabla | Datos Extraídos |
|-------|-----------------|
| `pedidos` | Ventas, totales, estados, timestamps, items (JSONB), tipo de pedido |
| `mesas` | Ocupación, rotación, tiempos de uso |
| `productos` | Popularidad, disponibilidad, categorías |
| `empleados` | Pedidos atendidos por mesero, rendimiento |
| `fidelizacion_config` | Uso del programa de puntos |
| `clientes_puntos` | Top clientes, frecuencia de visitas |

### 📤 Formato de Respuesta del Agente

```json
{
  "resumen_dia": {
    "total_ventas": 450000,
    "total_pedidos": 32,
    "ticket_promedio": 14063,
    "pedidos_cancelados": 2
  },
  "top_platos": [
    { "nombre": "Hamburguesa Clásica", "ventas": 15, "ingreso": 195000 },
    { "nombre": "Pasta Bolognesa", "ventas": 10, "ingreso": 180000 }
  ],
  "horas_pico": ["12:00-14:00", "19:00-21:00"],
  "mesas_alerta": [
    { "mesa": 5, "espera_promedio_min": 18, "motivo": "Tiempos altos de preparación" }
  ],
  "meseros_top": [
    { "nombre": "Juan", "pedidos_atendidos": 12 },
    { "nombre": "María", "pedidos_atendidos": 9 }
  ],
  "acciones_sugeridas": [
    "🔥 Lanzar combo 2x1 en hamburguesas entre 15:00 y 17:00 (hora valle detectada).",
    "⚠️ Reforzar atención en Mesa 5: tiempos de espera por encima del promedio.",
    "💡 El 60% de los pedidos del día fueron de Hamburguesas. Considerar oferta cruzada con bebidas.",
    "📈 Los pedidos por WhatsApp crecieron un 20% vs. ayer. Potenciar este canal."
  ],
  "tendencias_semana": {
    "dia_mas_fuerte": "Viernes",
    "categoria_en_crecimiento": "Bebidas",
    "cliente_frecuente": "María López (5 visitas esta semana)"
  }
}
```

### 🖥️ Pantalla del Dashboard — `/dashboard/[slug]/ia`

La pantalla muestra cards informativas con los datos del agente:

1. **Card "Resumen del Día"** — Ventas totales, pedidos, ticket promedio.
2. **Card "Top Platos Hoy"** — Los 5 productos más vendidos con gráfico de barras.
3. **Card "Horas Pico"** — Mapa de calor con las horas de mayor demanda.
4. **Card "Alertas de Mesas"** — Mesas con tiempos de espera altos, resaltadas en rojo.
5. **Card "Rendimiento de Meseros"** — Ranking por pedidos atendidos.
6. **Card "Acciones Recomendadas"** — Lista priorizada de sugerencias de IA.
7. **Card "Tendencia Semanal"** — Patrones y oportunidades detectadas automáticamente.

### ⚙️ Implementación Backend (FastAPI)

```python
# Endpoint: GET /api/gemini/insights/{negocio_id}
@api_router.get("/gemini/insights/{negocio_id}")
async def get_ai_insights(negocio_id: str, business: Business = Depends(get_current_business)):
    if business.id != negocio_id:
        raise HTTPException(status_code=403, detail="No autorizado")

    # 1. Recopilar datos de las últimas 24 horas
    now = datetime.now(timezone.utc)
    yesterday = now - timedelta(hours=24)

    pedidos = supabase.table('pedidos').select('*').eq('negocio_id', negocio_id).gte('created_at', yesterday.isoformat()).execute()
    mesas = supabase.table('mesas').select('*').eq('negocio_id', negocio_id).execute()
    productos = supabase.table('productos').select('*').eq('negocio_id', negocio_id).execute()
    empleados = supabase.table('empleados').select('*').eq('negocio_id', negocio_id).execute()

    # 2. Construir contexto para Gemini
    context = {
        "pedidos": pedidos.data,
        "mesas": mesas.data,
        "productos": productos.data,
        "empleados": empleados.data,
        "fecha_actual": now.isoformat(),
        "negocio": business.model_dump()
    }

    # 3. Llamar a Google Gemini 1.5 Flash
    response = gemini_client.generate_content(
        f"""Analiza los siguientes datos del restaurante y genera un JSON con insights:
        {json.dumps(context, default=str)}

        Responde SOLO con JSON válido, sin markdown, sin explicaciones.
        Estructura: resumen_dia, top_platos, horas_pico, mesas_alerta,
        meseros_top, acciones_sugeridas, tendencias_semana."""
    )

    # 4. Parsear y devolver
    return json.loads(response.text)
```

### 🔌 Integraciones del Agente Gemini

| Servicio | Proveedor | Uso |
|----------|-----------|-----|
| IA Generativa | Google Gemini 1.5 Flash | Análisis de datos y generación de insights |
| Base de datos | Supabase (PostgreSQL) | Lectura de pedidos, mesas, productos, empleados |
| Frontend | React (Dashboard) | Visualización de cards con los insights |
| Autenticación | JWT (existente) | Solo dueños autenticados pueden ver sus insights |

### 🔑 Variables de Entorno Requeridas

```env
# Agente Gemini
GOOGLE_GEMINI_API_KEY=tu_api_key_de_gemini

# Agente WhatsApp (Twilio + OpenAI)
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
OPENAI_API_KEY=tu_api_key_de_openai
```

---

## 📈 Métricas de Éxito

### Agente WhatsApp
| Métrica | Descripción | Objetivo |
|---------|-------------|----------|
| Response Time | Tiempo de respuesta promedio | < 3 segundos |
| Order Conversion | % de conversaciones que terminan en pedido | > 30% |
| Intent Accuracy | Precisión del clasificador | > 90% |
| Order Accuracy | Pedidos correctos sin corrección posterior | > 95% |

### Agente Gemini
| Métrica | Descripción | Objetivo |
|---------|-------------|----------|
| Insight Relevance | % de sugerencias accionables por el dueño | > 80% |
| Dashboard Usage | Visitas diarias al panel de IA | > 1 por día |
| Data Freshness | Datos actualizados en las últimas 24h | 100% |

---

## 💻 Stack Técnico Completo

| Componente | Tecnología |
|------------|------------|
| Backend API | FastAPI (Python) |
| Base de Datos | Supabase (PostgreSQL) |
| WhatsApp API | Twilio (Sandbox → Producción) |
| Webhook | Supabase Edge Functions (Deno) |
| IA WhatsApp | OpenAI GPT-4o-mini (Function Calling) |
| IA Analytics | Google Gemini 1.5 Flash |
| Frontend | React.js + Tailwind CSS |
| Real-time | WebSockets (FastAPI ConnectionManager) |
| Autenticación | JWT + Bcrypt |
| Hosting | Hostinger (Frontend) + Supabase (Backend) |

---

## 🔒 Seguridad y Privacidad

- ✅ Almacenar solo datos necesarios para pedidos y comunicación.
- ✅ Normalizar números de teléfono antes de guardar (eliminar prefijo `whatsapp:`).
- ✅ Rate limiting por número para evitar spam (máximo 50 mensajes/día por cliente).
- ✅ Los insights de Gemini **solo** son accesibles por el dueño autenticado del negocio.
- ✅ Las Edge Functions usan `SUPABASE_SERVICE_ROLE_KEY` (nunca exponer al frontend).
- ✅ Permitir opt-out de mensajes promocionales.
