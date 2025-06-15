import { supabase } from "@/integrations/supabase/client";

export interface StockItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  user_id: string;
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Invoice {
  id: string;
  customer_name: string;
  customer_number: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  user_id: string;
  created_at: string;
}

export interface CompanyProfile {
  id: string;
  user_id: string;
  company_name: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  tax_id?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface UserBranding {
  id: string;
  user_id: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  template_id: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description?: string;
  preview_image?: string;
  is_premium: boolean;
  created_at: string;
}

// Stock Items Functions
export const getStockItems = async (): Promise<StockItem[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No authenticated user found');
    return [];
  }

  const { data, error } = await supabase
    .from('stock_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching stock items:', error);
    return [];
  }
  
  return data || [];
};

export const saveStockItem = async (item: Omit<StockItem, 'id' | 'created_at' | 'user_id'>): Promise<StockItem | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No authenticated user found');
    return null;
  }

  const { data, error } = await supabase
    .from('stock_items')
    .insert([{ ...item, user_id: user.id }])
    .select()
    .single();
  
  if (error) {
    console.error('Error saving stock item:', error);
    return null;
  }
  
  return data;
};

export const updateStockItem = async (id: string, updates: Partial<Omit<StockItem, 'id' | 'created_at' | 'user_id'>>): Promise<StockItem | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No authenticated user found');
    return null;
  }

  const { data, error } = await supabase
    .from('stock_items')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating stock item:', error);
    return null;
  }
  
  return data;
};

export const deleteStockItem = async (id: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No authenticated user found');
    return false;
  }

  const { error } = await supabase
    .from('stock_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  
  if (error) {
    console.error('Error deleting stock item:', error);
    return false;
  }
  
  return true;
};

// Invoice Functions
export const getInvoices = async (): Promise<Invoice[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No authenticated user found');
    return [];
  }

  const { data: invoicesData, error: invoicesError } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (invoicesError) {
    console.error('Error fetching invoices:', invoicesError);
    return [];
  }
  
  if (!invoicesData) return [];
  
  // Fetch invoice items for each invoice
  const invoicesWithItems = await Promise.all(
    invoicesData.map(async (invoice) => {
      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id);
      
      if (itemsError) {
        console.error('Error fetching invoice items:', itemsError);
        return {
          ...invoice,
          items: [],
          customer_name: invoice.customer_name,
          customer_number: invoice.customer_number,
          created_at: invoice.created_at,
        };
      }
      
      return {
        ...invoice,
        items: itemsData || [],
        customer_name: invoice.customer_name,
        customer_number: invoice.customer_number,
        created_at: invoice.created_at,
      };
    })
  );
  
  return invoicesWithItems;
};

export const saveInvoice = async (invoice: Omit<Invoice, 'id' | 'created_at' | 'user_id'>): Promise<Invoice | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No authenticated user found');
    return null;
  }

  // First, insert the invoice
  const { data: invoiceData, error: invoiceError } = await supabase
    .from('invoices')
    .insert([{
      customer_name: invoice.customer_name,
      customer_number: invoice.customer_number,
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      total: invoice.total,
      user_id: user.id,
    }])
    .select()
    .single();
  
  if (invoiceError || !invoiceData) {
    console.error('Error saving invoice:', invoiceError);
    return null;
  }
  
  // Then, insert the invoice items
  if (invoice.items.length > 0) {
    const itemsToInsert = invoice.items.map(item => ({
      invoice_id: invoiceData.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      total: item.total,
    }));
    
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert);
    
    if (itemsError) {
      console.error('Error saving invoice items:', itemsError);
      // Consider rolling back the invoice if items fail to save
    }
  }
  
  return {
    ...invoiceData,
    items: invoice.items,
    customer_name: invoiceData.customer_name,
    customer_number: invoiceData.customer_number,
    created_at: invoiceData.created_at,
  };
};

export const deleteInvoice = async (id: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No authenticated user found');
    return false;
  }

  // Delete invoice (items will be deleted automatically due to CASCADE)
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  
  if (error) {
    console.error('Error deleting invoice:', error);
    return false;
  }
  
  return true;
};

// Company Profile Functions
export const getCompanyProfile = async (): Promise<CompanyProfile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No authenticated user found');
    return null;
  }

  const { data, error } = await supabase
    .from('company_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // No company profile found, return null
      return null;
    }
    console.error('Error fetching company profile:', error);
    return null;
  }
  
  return data;
};

export const saveCompanyProfile = async (profile: Omit<CompanyProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<CompanyProfile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No authenticated user found');
    return null;
  }

  const { data, error } = await supabase
    .from('company_profiles')
    .upsert([{ ...profile, user_id: user.id }])
    .select()
    .single();
  
  if (error) {
    console.error('Error saving company profile:', error);
    return null;
  }
  
  return data;
};

// User Branding Functions
export const getUserBranding = async (): Promise<UserBranding | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No authenticated user found');
    return null;
  }

  const { data, error } = await supabase
    .from('user_branding')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // No branding found, return default
      return {
        id: '',
        user_id: user.id,
        primary_color: '#3B82F6',
        secondary_color: '#EF4444',
        font_family: 'Inter',
        template_id: 'modern',
        created_at: '',
        updated_at: ''
      };
    }
    console.error('Error fetching user branding:', error);
    return null;
  }
  
  return data;
};

export const saveUserBranding = async (branding: Omit<UserBranding, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<UserBranding | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No authenticated user found');
    return null;
  }

  const { data, error } = await supabase
    .from('user_branding')
    .upsert([{ ...branding, user_id: user.id }])
    .select()
    .single();
  
  if (error) {
    console.error('Error saving user branding:', error);
    return null;
  }
  
  return data;
};

// Invoice Templates Functions
export const getInvoiceTemplates = async (): Promise<InvoiceTemplate[]> => {
  const { data, error } = await supabase
    .from('invoice_templates')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching invoice templates:', error);
    return [];
  }
  
  return data || [];
};

// Logo Upload Function
export const uploadLogo = async (file: File): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No authenticated user found');
    return null;
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/logo.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('logos')
    .upload(fileName, file, { upsert: true });

  if (error) {
    console.error('Error uploading logo:', error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('logos')
    .getPublicUrl(fileName);

  return publicUrl;
};

// Utility functions
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
