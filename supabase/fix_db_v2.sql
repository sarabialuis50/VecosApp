-- SQL Migration to support Categories, Tags, and Fix Orders
-- Run this in Supabase SQL Editor

-- 1. Create Categorias table
CREATE TABLE IF NOT EXISTS categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    negocio_id UUID REFERENCES negocios(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(negocio_id, nombre)
);

-- 2. Create Etiquetas table
CREATE TABLE IF NOT EXISTS etiquetas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    negocio_id UUID REFERENCES negocios(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    color TEXT DEFAULT '#13ec6d',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(negocio_id, nombre)
);

-- 3. Ensure Pedidos table has correct JSONB structure for items
DO $$ 
BEGIN 
    -- Check if 'items' column exists in 'pedidos'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pedidos' AND column_name='items') THEN
        ALTER TABLE pedidos ADD COLUMN items JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Check if 'total' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pedidos' AND column_name='total') THEN
        ALTER TABLE pedidos ADD COLUMN total NUMERIC DEFAULT 0;
    END IF;

    -- Check if 'tipo' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pedidos' AND column_name='tipo') THEN
        ALTER TABLE pedidos ADD COLUMN tipo TEXT DEFAULT 'mesa';
    END IF;
    
    -- Check if 'cliente_nombre' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pedidos' AND column_name='cliente_nombre') THEN
        ALTER TABLE pedidos ADD COLUMN cliente_nombre TEXT;
    END IF;

    -- Check if 'cliente_telefono' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pedidos' AND column_name='cliente_telefono') THEN
        ALTER TABLE pedidos ADD COLUMN cliente_telefono TEXT;
    END IF;
END $$;

-- 4. Enable RLS or ensure policies (optional but good practice)
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE etiquetas ENABLE ROW LEVEL SECURITY;
-- Add policies if needed, or if using service_role key (backend) it bypasses RLS.
-- Since the frontend uses backend API, we rely on backend checks.

-- 5. Backfill any existing unique categories/tags from products (Optional/One-time)
-- Insert distinct categories from products into new table if they don't exist
INSERT INTO categorias (negocio_id, nombre)
SELECT DISTINCT p.negocio_id, p.categoria
FROM productos p
WHERE p.categoria IS NOT NULL AND p.categoria != ''
ON CONFLICT (negocio_id, nombre) DO NOTHING;

-- Insert distinct tags from products into new table
INSERT INTO etiquetas (negocio_id, nombre)
SELECT DISTINCT p.negocio_id, p.etiqueta
FROM productos p
WHERE p.etiqueta IS NOT NULL AND p.etiqueta != ''
ON CONFLICT (negocio_id, nombre) DO NOTHING;
