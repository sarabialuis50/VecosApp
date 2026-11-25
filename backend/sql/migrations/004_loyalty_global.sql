-- 004_loyalty_global.sql
-- Dominio: Fidelidad Global

-- 1. Tabla de Cuentas de Fidelidad Global
CREATE TABLE IF NOT EXISTS public.loyalty_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
    telefono VARCHAR(50) NOT NULL,
    nombre VARCHAR(255),
    email VARCHAR(255),
    puntos_totales INT DEFAULT 0,
    puntos_actuales INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(brand_id, telefono)
);

-- 2. Transacciones de Fidelidad (Trazabilidad por Sede)
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES public.loyalty_accounts(id) ON DELETE CASCADE,
    sede_id UUID REFERENCES public.negocios(id) ON DELETE SET NULL,
    tipo VARCHAR(50) NOT NULL, -- 'acumulado', 'redimido', 'reverso'
    puntos INT NOT NULL, -- Positivo (acumulado, reverso) o negativo (redimido)
    reference_id VARCHAR(255), -- Ej: order_id. Ayuda con idempotencia y rastreo.
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Opcional: Índice para garantizar que no se acumulen puntos duplicados para un mismo pedido
CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_idempotency 
ON public.loyalty_transactions (account_id, reference_id, tipo)
WHERE reference_id IS NOT NULL;
