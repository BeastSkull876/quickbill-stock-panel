
-- First, add user_id columns as nullable
ALTER TABLE public.stock_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Get the first existing authenticated user to assign existing data to
DO $$
DECLARE
    existing_user_id UUID;
BEGIN
    -- Try to get the first existing user from auth.users
    SELECT id INTO existing_user_id 
    FROM auth.users 
    LIMIT 1;
    
    -- If we have an existing user, assign all existing data to them
    IF existing_user_id IS NOT NULL THEN
        UPDATE public.stock_items SET user_id = existing_user_id WHERE user_id IS NULL;
        UPDATE public.invoices SET user_id = existing_user_id WHERE user_id IS NULL;
    ELSE
        -- If no users exist, we'll delete existing data since we can't assign it to anyone
        -- This is safe for new installations but be careful if you have important data
        DELETE FROM public.invoice_items WHERE invoice_id IN (SELECT id FROM public.invoices);
        DELETE FROM public.invoices;
        DELETE FROM public.stock_items;
    END IF;
END $$;

-- Now make user_id NOT NULL since all records have values or are deleted
ALTER TABLE public.stock_items ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN user_id SET NOT NULL;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Admins can manage stock items" ON public.stock_items;
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can manage invoice items" ON public.invoice_items;

-- Create new RLS policies for user-specific data access
CREATE POLICY "Users can manage their own stock items" ON public.stock_items
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own invoices" ON public.invoices
  FOR ALL USING (auth.uid() = user_id);

-- Invoice items policy based on invoice ownership
CREATE POLICY "Users can manage their own invoice items" ON public.invoice_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

-- Update the handle_new_user function to assign 'user' role by default
-- Each user gets their own separate account
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user'::user_role  -- Each new user gets their own separate account
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
