import { supabase } from "@/lib/supabase";

export interface StockItem {
  id: string;
  user_id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  created_at: string;
  updated_at: string;
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
  user_id: string;
  customer_name: string;
  customer_number: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  created_at: string;
  updated_at: string;
}

export interface UserBranding {
  id: string;
  user_id: string;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  template_id: string;
  logo_url?: string;
  template_settings?: string; // JSON string for template customization
  created_at: string;
  updated_at: string;
}

export interface CompanyProfile {
  id: string;
  user_id: string;
  company_name: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  website?: string;
  tax_id?: string;
  created_at: string;
  updated_at: string;
}

export const getStockItems = async (): Promise<StockItem[]> => {
  try {
    const { data, error } = await supabase
      .from('stock_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching stock items:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getStockItems:", error);
    throw error;
  }
};

export const saveStockItem = async (item: Omit<StockItem, 'id' | 'created_at' | 'updated_at'>, id?: string): Promise<StockItem | null> => {
  try {
    if (id) {
      // Update existing stock item
      const { data, error } = await supabase
        .from('stock_items')
        .update(item)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error("Error updating stock item:", error);
        throw error;
      }

      return data;
    } else {
      // Create new stock item
      const { data, error } = await supabase
        .from('stock_items')
        .insert([item])
        .select('*')
        .single();

      if (error) {
        console.error("Error saving stock item:", error);
        throw error;
      }

      return data;
    }
  } catch (error) {
    console.error("Error in saveStockItem:", error);
    throw error;
  }
};

export const deleteStockItem = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('stock_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting stock item:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteStockItem:", error);
    return false;
  }
};

export const getInvoices = async (): Promise<Invoice[]> => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching invoices:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getInvoices:", error);
    throw error;
  }
};

export const saveInvoice = async (
  invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'user_id'>,
  stockItemsMap: Map<string, StockItem>
): Promise<Invoice | null> => {
  try {
    // Start a Supabase transaction
    const { data: newInvoice, error: invoiceError } = await supabase.from('invoices').insert([{
      customer_name: invoice.customer_name,
      customer_number: invoice.customer_number,
      items: invoice.items,
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      total: invoice.total,
      user_id: supabase.auth.user()?.id,
    }]).select('*').single();

    if (invoiceError) {
      console.error("Error creating invoice:", invoiceError);
      throw invoiceError;
    }

    // Update stock quantities
    for (const item of invoice.items) {
      const stockItem = stockItemsMap.get(item.name);
      if (stockItem) {
        const newQuantity = stockItem.quantity - item.quantity;
        if (newQuantity < 0) {
          throw new Error(`Insufficient stock for item: ${item.name}`);
        }

        const { error: stockError } = await supabase
          .from('stock_items')
          .update({ quantity: newQuantity })
          .eq('id', stockItem.id);

        if (stockError) {
          console.error("Error updating stock item:", stockError);
          throw stockError;
        }
      }
    }

    return newInvoice;
  } catch (error) {
    console.error("Error in saveInvoice:", error);
    throw error;
  }
};

export const deleteInvoice = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting invoice:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteInvoice:", error);
    return false;
  }
};

export const getUserBranding = async (): Promise<UserBranding | null> => {
  try {
    const userId = supabase.auth.user()?.id;
    if (!userId) {
      console.error("No user ID found.");
      return null;
    }

    const { data, error } = await supabase
      .from('user_branding')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error("Error fetching user branding:", error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error("Error in getUserBranding:", error);
    return null;
  }
};

export const saveUserBranding = async (branding: UserBranding): Promise<UserBranding | null> => {
  try {
    const { data, error } = await supabase
      .from('user_branding')
      .upsert(
        [branding],
        { onConflict: 'user_id' }
      )
      .select('*')
      .single();

    if (error) {
      console.error("Error saving user branding:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in saveUserBranding:", error);
    throw error;
  }
};

export const getCompanyProfile = async (): Promise<CompanyProfile | null> => {
  try {
    const userId = supabase.auth.user()?.id;
    if (!userId) {
      console.error("No user ID found.");
      return null;
    }

    const { data, error } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error("Error fetching company profile:", error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error("Error in getCompanyProfile:", error);
    return null;
  }
};

export const saveCompanyProfile = async (profile: CompanyProfile): Promise<CompanyProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('company_profiles')
      .upsert(
        [profile],
        { onConflict: 'user_id' }
      )
      .select('*')
      .single();

    if (error) {
      console.error("Error saving company profile:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in saveCompanyProfile:", error);
    throw error;
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};
