-- Tabla para guardar direcciones de clientes por negocio
CREATE TABLE IF NOT EXISTS clientes_direcciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    negocio_id UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
    telefono TEXT NOT NULL,
    direccion TEXT NOT NULL,
    latitud DECIMAL(10, 7),
    longitud DECIMAL(10, 7),
    es_principal BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_clientes_direcciones_negocio_telefono 
    ON clientes_direcciones(negocio_id, telefono);

-- Política RLS
ALTER TABLE clientes_direcciones ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer (el agente necesita consultar)
CREATE POLICY "clientes_direcciones_select" ON clientes_direcciones
    FOR SELECT USING (true);

-- El servicio puede insertar/actualizar
CREATE POLICY "clientes_direcciones_insert" ON clientes_direcciones
    FOR INSERT WITH CHECK (true);

CREATE POLICY "clientes_direcciones_update" ON clientes_direcciones
    FOR UPDATE USING (true);

CREATE POLICY "clientes_direcciones_delete" ON clientes_direcciones
    FOR DELETE USING (true);
