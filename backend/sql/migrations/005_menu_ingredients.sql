-- 005_menu_ingredients.sql
-- Relación muchos-a-muchos entre platos (menu_items / productos) e ingredientes (single-business)

CREATE TABLE IF NOT EXISTS public.ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'acompanante', -- 'proteina', 'arroz', 'sopa', 'ensalada', 'acompanante', 'verdura', 'bebida'
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.menu_item_ingredients (
    menu_item_id UUID NOT NULL,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
    is_required BOOLEAN NOT NULL DEFAULT true,
    quantity NUMERIC(12, 3),
    unit TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (menu_item_id, ingredient_id)
);

CREATE INDEX IF NOT EXISTS idx_menu_item_ingredients_item
    ON public.menu_item_ingredients (menu_item_id);

CREATE INDEX IF NOT EXISTS idx_menu_item_ingredients_ingredient
    ON public.menu_item_ingredients (ingredient_id);

-- Datos base sugeridos para Fogón & Mesa
INSERT INTO public.ingredients (name, category, is_available, is_active) VALUES
    ('Pechuga de pollo', 'proteina', true, true),
    ('Churrasco de res', 'proteina', true, true),
    ('Sobrebarriga criolla', 'proteina', true, true),
    ('Filete de tilapia', 'proteina', true, true),
    ('Costillitas de cerdo', 'proteina', true, true),
    ('Mariscos mixtos', 'proteina', true, true),
    ('Arroz blanco', 'arroz', true, true),
    ('Arroz con cilantro', 'arroz', true, true),
    ('Arroz de coco', 'arroz', true, true),
    ('Sopa de verduras', 'sopa', true, true),
    ('Crema de ahuyama', 'sopa', true, true),
    ('Consomé de pollo', 'sopa', true, true),
    ('Ensalada fresca', 'ensalada', true, true),
    ('Tajada madura', 'acompanante', true, true),
    ('Yuca frita', 'acompanante', true, true),
    ('Patacones', 'acompanante', true, true),
    ('Papa criolla', 'acompanante', true, true),
    ('Verduras salteadas', 'verdura', true, true)
ON CONFLICT (name) DO NOTHING;
