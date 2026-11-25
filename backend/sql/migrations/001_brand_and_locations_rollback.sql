-- 001_brand_and_locations_rollback.sql

DROP TABLE IF EXISTS public.whatsapp_configs CASCADE;
ALTER TABLE public.negocios DROP COLUMN IF EXISTS brand_id;
DROP TABLE IF EXISTS public.brands CASCADE;
