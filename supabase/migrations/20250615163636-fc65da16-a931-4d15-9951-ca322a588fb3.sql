
-- Create table for storing user's company/business information
CREATE TABLE public.company_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  tax_id TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create table for storing user's branding preferences
CREATE TABLE public.user_branding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#EF4444',
  font_family TEXT DEFAULT 'Inter',
  template_id TEXT DEFAULT 'modern',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create table for available invoice templates
CREATE TABLE public.invoice_templates (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  preview_image TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default templates
INSERT INTO public.invoice_templates (id, name, description, is_premium) VALUES
('modern', 'Modern', 'Clean and minimalist design with bold headers', false),
('classic', 'Classic', 'Traditional business invoice layout', false),
('minimal', 'Minimal', 'Ultra-clean design with maximum white space', false),
('corporate', 'Corporate', 'Professional layout with header and footer sections', true);

-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

-- Add RLS policies
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_branding ENABLE ROW LEVEL SECURITY;

-- RLS policies for company_profiles
CREATE POLICY "Users can manage their own company profile" ON public.company_profiles
  FOR ALL USING (auth.uid() = user_id);

-- RLS policies for user_branding
CREATE POLICY "Users can manage their own branding" ON public.user_branding
  FOR ALL USING (auth.uid() = user_id);

-- RLS policies for invoice_templates (read-only for all authenticated users)
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can view templates" ON public.invoice_templates
  FOR SELECT TO authenticated USING (true);

-- Storage policies for logos bucket
CREATE POLICY "Users can upload their own logos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view all logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "Users can update their own logos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'logos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own logos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'logos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
