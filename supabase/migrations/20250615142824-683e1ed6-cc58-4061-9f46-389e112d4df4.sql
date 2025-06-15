
-- Add quantity column to stock_items table
ALTER TABLE public.stock_items 
ADD COLUMN quantity INTEGER NOT NULL DEFAULT 0;

-- Update existing stock items to have a default quantity of 10
UPDATE public.stock_items 
SET quantity = 10 
WHERE quantity = 0;
