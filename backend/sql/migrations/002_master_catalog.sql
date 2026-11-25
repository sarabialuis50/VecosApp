-- 002_master_catalog.sql
-- Dominio: Catálogo Maestro Modular y Overrides por Sede

-- 1. Crear tabla de categorías globales
CREATE TABLE IF NOT EXISTS public.global_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    orden INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Crear tabla de productos globales (Catálogo Maestro)
CREATE TABLE IF NOT EXISTS public.global_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.global_categories(id) ON DELETE SET NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio_base NUMERIC(10, 2) NOT NULL,
    imagen TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Crear tabla de overrides por sede (sede_products)
CREATE TABLE IF NOT EXISTS public.sede_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sede_id UUID REFERENCES public.negocios(id) ON DELETE CASCADE,
    global_product_id UUID REFERENCES public.global_products(id) ON DELETE CASCADE,
    activo BOOLEAN DEFAULT true,
    disponible BOOLEAN DEFAULT true,
    precio_local NUMERIC(10, 2), -- Si es NULL, usa el precio_base del global_product
    -- Campo abierto para futuros overrides controlados (ej. impuestos locales, disponibilidad por horarios)
    config_adicional JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(sede_id, global_product_id)
);
