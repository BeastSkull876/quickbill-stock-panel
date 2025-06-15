
export interface StockItem {
  id: string;
  name: string;
  price: number;
  createdAt: string;
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
  customerName: string;
  customerNumber: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  createdAt: string;
}

export const getStockItems = (): StockItem[] => {
  const items = localStorage.getItem('stockItems');
  return items ? JSON.parse(items) : [];
};

export const saveStockItems = (items: StockItem[]) => {
  localStorage.setItem('stockItems', JSON.stringify(items));
};

export const getInvoices = (): Invoice[] => {
  const invoices = localStorage.getItem('invoices');
  return invoices ? JSON.parse(invoices) : [];
};

export const saveInvoices = (invoices: Invoice[]) => {
  localStorage.setItem('invoices', JSON.stringify(invoices));
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
