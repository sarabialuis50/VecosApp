-- 003_recipes_and_inventory.sql
-- Dominio: Inventario Inteligente y Recetas

-- 1. Tabla Global de Ingredientes
CREATE TABLE IF NOT EXISTS public.global_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    unidad_medida VARCHAR(50) NOT NULL, -- Ej: 'gramos', 'unidades', 'mililitros'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabla Global de Recetas
CREATE TABLE IF NOT EXISTS public.global_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    global_product_id UUID REFERENCES public.global_products(id) ON DELETE CASCADE,
    nombre VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(global_product_id)
);

-- 3. Tabla de Ingredientes por Receta (Composición)
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID REFERENCES public.global_recipes(id) ON DELETE CASCADE,
    global_ingredient_id UUID REFERENCES public.global_ingredients(id) ON DELETE CASCADE,
    cantidad NUMERIC(10, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(recipe_id, global_ingredient_id)
);

-- 4. Inventario Local por Sede
CREATE TABLE IF NOT EXISTS public.sede_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sede_id UUID REFERENCES public.negocios(id) ON DELETE CASCADE,
    global_ingredient_id UUID REFERENCES public.global_ingredients(id) ON DELETE CASCADE,
    stock_actual NUMERIC(10, 4) DEFAULT 0,
    stock_minimo NUMERIC(10, 4) DEFAULT 0,
    costo_unitario NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(sede_id, global_ingredient_id)
);

-- 5. Transacciones de Inventario (Auditable e Idempotente)
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sede_id UUID REFERENCES public.negocios(id) ON DELETE CASCADE,
    global_ingredient_id UUID REFERENCES public.global_ingredients(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'entrada', 'venta', 'merma', 'ajuste', 'reverso_cancelacion'
    cantidad NUMERIC(10, 4) NOT NULL, -- Positivo (entradas, reversos) o negativo (ventas, mermas)
    reference_id VARCHAR(255), -- Ej: order_id. Para garantizar idempotencia.
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Índice para asegurar idempotencia por reference_id y global_ingredient_id y tipo
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_idempotency 
ON public.inventory_transactions (sede_id, reference_id, global_ingredient_id, tipo)
WHERE reference_id IS NOT NULL;
