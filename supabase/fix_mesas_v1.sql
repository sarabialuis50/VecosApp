-- SQL Fixes for Tables and Columns

-- 1. Add missing 'ubicacion' column to 'mesas'
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mesas' AND column_name='ubicacion') THEN
        ALTER TABLE mesas ADD COLUMN ubicacion TEXT;
    END IF;
END $$;

-- 2. Verify 'negocios' table columns (optional, just safety)
-- Nothing critical missing based on 500 log analysis so far, but could add checks if needed.

-- 3. Verify 'empleados' table columns
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='empleados' AND column_name='activo') THEN
        ALTER TABLE empleados ADD COLUMN activo BOOLEAN DEFAULT TRUE;
    END IF;
END $$;
