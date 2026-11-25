-- ============================================================
-- MIGRACIÓN: Tablas para el Agente WhatsApp de MenuPro
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Tabla: Conversaciones del agente WhatsApp
CREATE TABLE IF NOT EXISTS public.agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id UUID REFERENCES public.negocios(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'pending_human')),
  current_intent TEXT,
  context JSONB DEFAULT '{}',
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Tabla: Historial de mensajes del agente
CREATE TABLE IF NOT EXISTS public.agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT DEFAULT 'text',
  content TEXT NOT NULL,
  intent TEXT,
  confidence DECIMAL(3,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_agent_conversations_phone
  ON public.agent_conversations(phone_number);

CREATE INDEX IF NOT EXISTS idx_agent_conversations_negocio
  ON public.agent_conversations(negocio_id);

CREATE INDEX IF NOT EXISTS idx_agent_conversations_status
  ON public.agent_conversations(status);

CREATE INDEX IF NOT EXISTS idx_agent_messages_conversation
  ON public.agent_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_agent_messages_created
  ON public.agent_messages(created_at DESC);

-- 4. Habilitar Realtime para mensajes (opcional, para el dashboard)
ALTER PUBLICATION supabase_realtime ADD TABLE agent_messages;

-- ============================================================
-- VERIFICACIÓN: Ejecuta esto para confirmar que se crearon
-- ============================================================
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name LIKE 'agent_%';
