-- 003_recipes_and_inventory_rollback.sql

DROP TABLE IF EXISTS public.inventory_transactions CASCADE;
DROP TABLE IF EXISTS public.sede_inventory CASCADE;
DROP TABLE IF EXISTS public.recipe_ingredients CASCADE;
DROP TABLE IF EXISTS public.global_recipes CASCADE;
DROP TABLE IF EXISTS public.global_ingredients CASCADE;
