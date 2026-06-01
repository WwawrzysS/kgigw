ALTER TABLE public.rental_inventory
ADD COLUMN IF NOT EXISTS replacement_value numeric;
