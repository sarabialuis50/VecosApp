# 🤖 Fideli.IA WhatsApp Agent

<div align="center">

![WhatsApp Agent](https://img.shields.io/badge/WhatsApp-Agent-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)
![AI Powered](https://img.shields.io/badge/AI-Powered-FF6B6B?style=for-the-badge&logo=openai&logoColor=white)

**Agente Inteligente de WhatsApp para Automatización de Fidelización**

</div>

---

## � Descripción General

El **Fideli.IA WhatsApp Agent** es un agente conversacional inteligente diseñado para automatizar las interacciones con clientes a través de WhatsApp. Permite a los negocios gestionar su programa de fidelización de manera automatizada, mejorando la experiencia del cliente y reduciendo la carga operativa.

## 🎯 Objetivos del Agente

1. **Automatizar consultas frecuentes** sobre puntos y recompensas.
2. **Notificar proactivamente** a clientes sobre promociones y logros.
3. **Facilitar el canje de recompensas** directamente desde WhatsApp.
4. **Recopilar feedback** de los clientes.
5. **Incrementar el engagement** con mensajes personalizados.

---

## 🧠 Arquitectura del Agente

```
┌─────────────────────────────────────────────────────────────────┐
│                     FIDELI.IA WHATSAPP AGENT                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐   │
│   │  WhatsApp   │───▶│   Message    │───▶│   Intent        │   │
│   │  Business   │    │   Handler    │    │   Classifier    │   │
│   │  API        │    │              │    │   (AI/NLP)      │   │
│   └─────────────┘    └──────────────┘    └────────┬────────┘   │
│                                                    │            │
│   ┌─────────────┐    ┌──────────────┐    ┌────────▼────────┐   │
│   │  Response   │◀───│   Action     │◀───│   Conversation  │   │
│   │  Generator  │    │   Executor   │    │   Manager       │   │
│   └──────┬──────┘    └──────────────┘    └─────────────────┘   │
│          │                    │                                  │
│          │           ┌───────▼────────┐                         │
│          │           │   Supabase     │                         │
│          │           │   Database     │                         │
│          │           └────────────────┘                         │
│          │                                                       │
│          ▼                                                       │
│   ┌─────────────┐                                               │
│   │  WhatsApp   │                                               │
│   │  Response   │                                               │
│   └─────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💬 Casos de Uso

### 1. Consulta de Puntos
```
Cliente: "¿Cuántos puntos tengo?"

Agente: "¡Hola María! 👋
En tu tarjeta de *Cafetería El Buen Sabor* tienes:
• 🎯 Puntos acumulados: 85 puntos
• 🏆 Te faltan 15 puntos para tu próxima recompensa
• 📊 Total de visitas: 9

¡Sigue así! 💪"
```

### 2. Consulta de Recompensas Disponibles
```
Cliente: "¿Qué recompensas tienen?"

Agente: "🎁 *Recompensas disponibles en Cafetería El Buen Sabor:*

1. ☕ Café gratis - 100 puntos
2. 🥐 Croissant gratis - 50 puntos
3. 🎂 Postre del día - 150 puntos

Tienes *85 puntos*. ¡Ya puedes canjear un croissant! 🥐

¿Te gustaría canjearlo ahora?"
```

### 3. Canje de Recompensa
```
Cliente: "Quiero canjear el croissant"

Agente: "✅ *¡Listo, María!*

Tu recompensa ha sido reservada:
🥐 Croissant gratis

📍 Presenta este código en el local:
*CANJE-2024-8574*

⏰ Válido por 48 horas

¡Que lo disfrutes! 😊"
```

### 4. Registro de Nueva Visita (Notificación Automática)
```
Agente: "🎉 *¡Gracias por tu visita, María!*

Has ganado +10 puntos en *Cafetería El Buen Sabor*

📊 Tu nuevo balance: 95 puntos
🏆 ¡Solo 5 puntos más para tu café gratis!

¡Te esperamos pronto! ☕"
```

### 5. Notificación de Promoción Segmentada
```
Agente: "� *¡Promoción Exclusiva para Nivel Oro!*

Hola María, por ser parte de nuestro nivel *Oro* 🏆, hemos activado para ti:

🎁 *Malteada de la Casa*
🎯 Puntos necesarios: 400 Pts
⏰ Válido hasta: 15 de Febrero

¡Aprovecha tus puntos antes de que venza! 🥤"
```

---

## 🚀 Lógica de Fidelización Avanzada

El sistema ahora integra una estructura VIP multinivel que los agentes deben conocer para segmentar correctamente las respuestas y acciones.

### 1. Estructura VIP (Niveles)
Los negocios definen reglas para 5 niveles de lealtad. Cada nivel tiene un icono y significado específico:
- **Bronce** 🥉 (Icono: `Award`): Nivel inicial.
- **Plata** 🥈 (Icono: `Trophy`): Clientes recurrentes.
- **Oro** 🥇 (Icono: `Medal`): Clientes fieles.
- **Platino** 💎 (Icono: `Zap`): Clientes top.
- **Diamante** ✨ (Icono: `Gem`): El nivel más alto de exclusividad.

*Regla:* Al subir de nivel, el sistema puede entregar **Hitos (Automated Rewards)** de forma automática.

### 2. Segmentación de Campañas (Puntos, Promos y Descuentos)
Todas las campañas (ya sean canjes por puntos, ofertas 2x1 o cupones de descuento) comparten estas reglas de negocio:
- **Nivel Mínimo:** Solo activable si el cliente pertenece al nivel requerido o superior.
- **Costo en Puntos:** Todas las promociones y descuentos pueden tener un costo en puntos asociado (etiqueta: "Puntos Necesarios").
- **Control Temporal:** Las promociones tienen `fechaInicio` y `fechaFin`.
- **Ofertas Libres:** Las promociones permiten tipos de oferta libres (ej. "3x2", "Regalo sorpresa").

### 3. Estándares Visuales (Para Generación de Respuestas)
Al describir beneficios por WhatsApp o Chat, seguir estos estándares:
- **Puntos:** Siempre referirse como "Puntos Necesarios" (ej. "400 Pts").
- **Vencimiento:** Informar siempre los días restantes (ej. "Vence en 2 días").
- **Nivel:** Resaltar el nivel requerido con su icono correspondiente.

---

## 🔧 Componentes del Sistema

### 1. Message Handler
Responsable de recibir y procesar mensajes entrantes de WhatsApp.

```typescript
interface IncomingMessage {
  from: string;           // Número de teléfono del cliente
  body: string;           // Contenido del mensaje
  timestamp: Date;        // Fecha y hora
  messageType: 'text' | 'image' | 'location' | 'button_reply';
  businessId?: string;    // ID del negocio (si aplica)
}
```

### 2. Intent Classifier
Clasifica la intención del mensaje usando NLP/AI.

```typescript
type Intent =
  | 'check_points'           // Consultar puntos
  | 'list_rewards'           // Ver recompensas
  | 'redeem_reward'          // Canjear recompensa
  | 'check_history'          // Ver historial
  | 'register'               // Registrarse
  | 'help'                   // Ayuda
  | 'greeting'               // Saludo
  | 'feedback'               // Feedback
  | 'unknown';               // No reconocido

interface ClassifiedIntent {
  intent: Intent;
  confidence: number;
  entities: {
    rewardId?: string;
    businessSlug?: string;
    points?: number;
  };
}
```

### 3. Conversation Manager
Gestiona el estado de las conversaciones con contexto.

```typescript
interface ConversationState {
  sessionId: string;
  customerId: string;
  businessId: string | null;
  currentIntent: Intent | null;
  awaitingResponse: boolean;
  context: {
    lastMessage: string;
    pendingAction: 'confirm_redeem' | 'select_business' | null;
    tempData: Record<string, any>;
  };
  history: Message[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 4. Action Executor
Ejecuta acciones en la base de datos de Supabase.

```typescript
interface AgentActions {
  // Consultas
  getCustomerPoints(customerId: string, businessId: string): Promise<LoyaltyCard>;
  getAvailableRewards(businessId: string, customerLevel: string): Promise<Reward[]>; // Ahora filtra por nivel
  getTransactionHistory(customerId: string): Promise<Transaction[]>;
 
  // Operaciones
  redeemReward(customerId: string, rewardId: string): Promise<RedemptionResult>;
  registerCustomer(phone: string, name: string): Promise<Customer>;
  checkLevelEligibility(customerId: string): Promise<LoyaltyLevel>; // Nueva lógica de niveles
 
  // Notificaciones
  sendPointsNotification(customerId: string, points: number): Promise<void>;
  sendPromoNotification(businessId: string, message: string, segment?: string): Promise<void>; // Soporta segmentación por nivel
}
```

### 5. Response Generator
Genera respuestas personalizadas y amigables.

```typescript
interface ResponseTemplate {
  type: 'text' | 'buttons' | 'list' | 'template';
  content: string;
  buttons?: Button[];
  variables: Record<string, string>;
}
```

---

## � Integraciones

### WhatsApp Business API
- **Proveedor recomendado**: Meta Cloud API / Twilio / 360dialog
- **Soporte para**:
  - Mensajes de texto
  - Botones interactivos
  - Listas de opciones
  - Templates pre-aprobados

### Supabase
- **Tablas utilizadas**:
  - `profiles` - Datos del cliente
  - `loyalty_cards` - Tarjetas de fidelidad
  - `point_transactions` - Historial de transacciones
  - `businesses` - Información del negocio
  - `agent_conversations` (nueva) - Estado de conversaciones
  - `agent_messages` (nueva) - Historial de mensajes

### AI/NLP Engine
- **Opciones**:
  - Google Gemini (Recomendado para Fideli.IA)
  - OpenAI GPT-4 / GPT-3.5-turbo
  - Anthropic Claude

---

## 📊 Nueva Estructura de Base de Datos

### Tabla: `agent_conversations`
```sql
CREATE TABLE public.agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(user_id),
  business_id UUID REFERENCES businesses(id),
  phone_number TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'pending_human')),
  current_intent TEXT,
  context JSONB DEFAULT '{}',
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Tabla: `agent_messages`
```sql
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

### Tabla: `scheduled_notifications`
```sql
CREATE TABLE public.scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  customer_id UUID REFERENCES profiles(user_id),
  notification_type TEXT NOT NULL,
  message_template TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

---

## 🔒 Seguridad y Privacidad

### Políticas de Datos
- ✅ Almacenar solo datos necesarios
- ✅ Encriptar números de teléfono
- ✅ Consentimiento explícito para mensajes promocionales
- ✅ Opción de opt-out en cada mensaje
- ✅ Cumplimiento con GDPR/LGPD

### Rate Limiting
- Máximo 100 mensajes por cliente por día
- Máximo 10 mensajes promocionales por semana
- Cooldown de 1 hora entre mensajes automatizados

### Escalación a Humano
Trigger automático cuando:
- Confidence del intent < 60%
- Cliente solicita hablar con una persona
- Mensaje contiene palabras clave de queja
- 3+ intentos fallidos consecutivos

---

## 📈 Métricas del Agente

| Métrica | Descripción | Objetivo |
|---------|-------------|----------|
| Response Time | Tiempo de respuesta promedio | < 3 segundos |
| Resolution Rate | % de consultas resueltas sin humano | > 85% |
| Intent Accuracy | Precisión del clasificador | > 90% |
| Customer Satisfaction | CSAT post-interacción | > 4.5/5 |
| Engagement Rate | % de clientes que responden | > 40% |
| Opt-out Rate | % de clientes que se dan de baja | < 5% |

---

## � Flujo de Implementación

### Fase 1: MVP (2-3 semanas)
- [ ] Conexión con WhatsApp Business API
- [ ] Consulta básica de puntos
- [ ] Respuestas predefinidas (sin AI)
- [ ] Notificación de nueva visita

### Fase 2: AI Integration (2-3 semanas)
- [ ] Clasificador de intenciones con AI
- [ ] Respuestas dinámicas y personalizadas
- [ ] Manejo de contexto conversacional
- [ ] Lista de recompensas

### Fase 3: Full Automation (3-4 semanas)
- [ ] Canje de recompensas por WhatsApp
- [ ] Notificaciones programadas
- [ ] Campañas promocionales
- [ ] Dashboard de métricas del agente

### Fase 4: Advanced Features (4+ semanas)
- [ ] Multi-idioma
- [ ] Análisis de sentimiento
- [ ] Recomendaciones personalizadas
- [ ] Integración con CRM

---

## 💻 Stack Técnico Recomendado

| Componente | Tecnología |
|------------|------------|
| Runtime | Node.js 20+ / Bun |
| Framework | Express.js / Hono |
| WhatsApp API | Twilio / Meta Cloud API |
| AI/NLP | Google Gemini / OpenAI API |
| Database | Supabase (PostgreSQL) |
| Queue | BullMQ / Supabase Edge Functions |
| Hosting | Supabase Edge Functions / Vercel |
| Monitoring | Sentry / Supabase Logs |

---

## 📚 Recursos

- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)
- [Google AI Studio (Gemini)](https://aistudio.google.com/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

<div align="center">

**Próximo paso: Ver [ROADMAP.md](./ROADMAP.md) para el plan de implementación detallado**

</div>
