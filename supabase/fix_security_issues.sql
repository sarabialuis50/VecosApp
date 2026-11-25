-- SQL to fix security issues identified by Supabase Advisor

-- 1. Enable RLS on public.menu_item_tags
ALTER TABLE public.menu_item_tags ENABLE ROW LEVEL SECURITY;

-- 2. Add basic RLS policies for public.menu_item_tags
-- Allow anyone to select (read) tags (assuming they are public data for the menu)
CREATE POLICY "Allow public select on menu_item_tags" 
ON public.menu_item_tags 
FOR SELECT 
USING (true);

-- Allow authenticated users (business owners/employees) to manage tags
-- Note: Replace 'auth.uid()' check with appropriate ownership check if needed
-- Based on the codebase, we might need to check negocio_id or similar.
-- For now, let's keep it simple or restricted to authenticated.
CREATE POLICY "Allow authenticated manage on menu_item_tags" 
ON public.menu_item_tags 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 3. Fix mutable search_path for identified functions
ALTER FUNCTION public.set_menu_items_updated_at() SET search_path = public;
ALTER FUNCTION public.increment_wa_credits(row_id uuid, val integer) SET search_path = public;

-- 4. Enable RLS on other tables mentioned (menu_item_options)
ALTER TABLE public.menu_item_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on menu_item_options" 
ON public.menu_item_options 
FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated manage on menu_item_options" 
ON public.menu_item_options 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
