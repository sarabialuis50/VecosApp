-- SQL Migration V3
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

-- 3. Ensure Pedidos table has correct columns
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

-- 4. Ensure Productos table has 'etiqueta' column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos' AND column_name='etiqueta') THEN
        ALTER TABLE productos ADD COLUMN etiqueta TEXT;
    END IF;
END $$;

-- 5. Enable RLS
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE etiquetas ENABLE ROW LEVEL SECURITY;

-- 6. Backfill categories (only if column exists, which it should)
INSERT INTO categorias (negocio_id, nombre)
SELECT DISTINCT p.negocio_id, p.categoria
FROM productos p
WHERE p.categoria IS NOT NULL AND p.categoria != ''
ON CONFLICT (negocio_id, nombre) DO NOTHING;

-- NOTE: We cannot backfill tags because the column 'etiqueta' might have just been created and is empty.
