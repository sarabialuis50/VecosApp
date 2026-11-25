-- 001_brand_and_locations.sql
-- Dominio: Estructura Multi-Sede y Marca Global

-- 1. Crear la tabla de Marca Global (Brand)
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    logo_url TEXT,
    configuracion_global JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Adaptar la tabla actual 'negocios' para que funcione como Sede local
-- Añadir la referencia a la marca
ALTER TABLE public.negocios 
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id);

-- Opcional: Insertar la marca inicial y asignar todos los negocios existentes a ella
-- INSERT INTO public.brands (nombre, slug) VALUES ('Menu.IA Burger', 'menuia-burger') ON CONFLICT DO NOTHING;
-- UPDATE public.negocios SET brand_id = (SELECT id FROM public.brands LIMIT 1) WHERE brand_id IS NULL;

-- 3. Modularizar WhatsApp Configs fuera de la tabla sedes/negocios
CREATE TABLE IF NOT EXISTS public.whatsapp_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    negocio_id UUID REFERENCES public.negocios(id) ON DELETE CASCADE,
    access_token TEXT,
    phone_number_id TEXT,
    webhook_verify_token TEXT,
    mensaje_bienvenida TEXT,
    is_configured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(negocio_id)
);

-- Migrar configuraciones existentes de la tabla negocios si las hay
-- (Asumiendo que algunos campos existían en 'negocios' o se manejaban como config genérica)
