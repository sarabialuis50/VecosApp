-- Add metodo_entrega column to pedidos table
DO $$ 
BEGIN 
    -- Check if 'metodo_entrega' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pedidos' AND column_name='metodo_entrega') THEN
        ALTER TABLE pedidos ADD COLUMN metodo_entrega TEXT;
    END IF;
END $$;
