-- SQL Migration V5: Add Destacado and Ofertas to Productos

-- Add columns to productos table
DO $$ 
BEGIN 
    -- Add destacado
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos' AND column_name='destacado') THEN
        ALTER TABLE productos ADD COLUMN destacado BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added destacado column to productos';
    END IF;

    -- Add oferta_porcentaje
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos' AND column_name='oferta_porcentaje') THEN
        ALTER TABLE productos ADD COLUMN oferta_porcentaje INTEGER;
        RAISE NOTICE 'Added oferta_porcentaje column to productos';
    END IF;

    -- Add precio_original
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos' AND column_name='precio_original') THEN
        ALTER TABLE productos ADD COLUMN precio_original NUMERIC;
        RAISE NOTICE 'Added precio_original column to productos';
    END IF;
END $$;
