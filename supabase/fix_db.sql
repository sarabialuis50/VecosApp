-- SQL para corregir la base de datos de MenuPro
-- Ejecuta esto en el SQL Editor de Supabase (https://supabase.com/dashboard/project/kgzbixgmunmbgzlegobb/sql)

-- 1. Agregar columna de etiquetas a productos si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos' AND column_name='etiqueta') THEN
        ALTER TABLE productos ADD COLUMN etiqueta TEXT;
    END IF;
END $$;

-- 2. Asegurar que las tablas de lealtad existan (si se planea usar)
CREATE TABLE IF NOT EXISTS clientes_puntos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    negocio_id UUID REFERENCES negocios(id) ON DELETE CASCADE,
    telefono TEXT NOT NULL,
    puntos INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(negocio_id, telefono)
);

CREATE TABLE IF NOT EXISTS configuracion_lealtad (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    negocio_id UUID REFERENCES negocios(id) ON DELETE CASCADE UNIQUE,
    puntos_por_asistencia INTEGER DEFAULT 10,
    porcentaje_puntos_compra NUMERIC DEFAULT 5,
    puntos_minimo_canje INTEGER DEFAULT 100,
    valor_punto_canje NUMERIC DEFAULT 1,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Agregar columnas faltantes a productos (para Destacados y Ofertas)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos' AND column_name='destacado') THEN
        ALTER TABLE productos ADD COLUMN destacado BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos' AND column_name='oferta_porcentaje') THEN
        ALTER TABLE productos ADD COLUMN oferta_porcentaje INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos' AND column_name='precio_original') THEN
        ALTER TABLE productos ADD COLUMN precio_original NUMERIC;
    END IF;
END $$;

-- 4. Asegurar que 'etiqueta' existe (repetido por seguridad)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos' AND column_name='etiqueta') THEN
        ALTER TABLE productos ADD COLUMN etiqueta TEXT;
    END IF;
END $$;
