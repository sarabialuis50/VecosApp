-- Add new columns to pedidos table if they don't exist
DO $$ 
BEGIN 
    -- Check if 'metodo_pago' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pedidos' AND column_name='metodo_pago') THEN
        ALTER TABLE pedidos ADD COLUMN metodo_pago TEXT DEFAULT 'Efectivo';
    END IF;

    -- Check if 'direccion' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pedidos' AND column_name='direccion') THEN
        ALTER TABLE pedidos ADD COLUMN direccion TEXT;
    END IF;

    -- Check if 'distancia' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pedidos' AND column_name='distancia') THEN
        ALTER TABLE pedidos ADD COLUMN distancia NUMERIC;
    END IF;

    -- Check if 'costo_envio' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pedidos' AND column_name='costo_envio') THEN
        ALTER TABLE pedidos ADD COLUMN costo_envio NUMERIC DEFAULT 0;
    END IF;
END $$;
