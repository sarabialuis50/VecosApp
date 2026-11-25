-- SQL Migration V4: Add empleado_id to Mesas

-- Add empleado_id column to mesas table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mesas' AND column_name='empleado_id') THEN
        ALTER TABLE mesas ADD COLUMN empleado_id UUID REFERENCES empleados(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added empleado_id column to mesas';
    END IF;
END $$;
