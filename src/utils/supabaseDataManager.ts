
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
