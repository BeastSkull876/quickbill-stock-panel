import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { 
  getStockItems, 
  saveInvoice, 
  formatCurrency, 
  getUserBranding,
  getCompanyProfile,
  StockItem, 
  InvoiceItem,
  UserBranding,
  CompanyProfile
} from "@/utils/supabaseDataManager";
import { generateInvoicePDF } from "@/components/InvoicePDFGenerator";
import { FileText, Plus, Trash2, Calculator, Download } from "lucide-react";

const CreateInvoice = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [selectedItems, setSelectedItems] = useState<InvoiceItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    stockItemId: "",
    quantity: "1",
  });
  const [discount, setDiscount] = useState("0");
  const [loading, setLoading] = useState(true);
  const [branding, setBranding] = useState<UserBranding | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [lastCreatedInvoice, setLastCreatedInvoice] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [items, brandingData, profileData] = await Promise.all([
        getStockItems(),
        getUserBranding(),
        getCompanyProfile()
      ]);
      setStockItems(items);
      setBranding(brandingData);
      setCompanyProfile(profileData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const addItem = () => {
    if (!currentItem.stockItemId || !currentItem.quantity) {
      toast({
        title: "Error",
        description: "Please select an item and enter quantity",
        variant: "destructive",
      });
      return;
    }

    const stockItem = stockItems.find(item => item.id === currentItem.stockItemId);
    if (!stockItem) return;

    const quantity = parseInt(currentItem.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    const newItem: InvoiceItem = {
      id: generateId(),
      name: stockItem.name,
      price: stockItem.price,
      quantity,
      total: stockItem.price * quantity,
    };

    setSelectedItems([...selectedItems, newItem]);
    setCurrentItem({ stockItemId: "", quantity: "1" });
  };

  const removeItem = (id: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== id));
  };

  const subtotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = (subtotal * parseFloat(discount || "0")) / 100;
  const total = subtotal - discountAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !customerNumber) {
      toast({
        title: "Error",
        description: "Please fill in customer details",
        variant: "destructive",
      });
      return;
    }

    if (selectedItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item",
        variant: "destructive",
      });
      return;
    }

    try {
      const newInvoice = await saveInvoice({
        customer_name: customerName,
        customer_number: customerNumber,
        items: selectedItems,
        subtotal,
        discount: parseFloat(discount || "0"),
        total,
      });

      if (newInvoice) {
        setLastCreatedInvoice(newInvoice);
        toast({
          title: "Success",
          description: "Invoice created successfully",
        });

        // Reset form
        setCustomerName("");
        setCustomerNumber("");
        setSelectedItems([]);
        setCurrentItem({ stockItemId: "", quantity: "1" });
        setDiscount("0");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = () => {
    if (lastCreatedInvoice) {
      generateInvoicePDF({
        invoice: lastCreatedInvoice,
        branding,
        companyProfile
      });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="flex items-center justify-between border-b bg-white px-6 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
              <p className="text-sm text-gray-500">Loading...</p>
            </div>
          </div>
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
        <div className="p-6">
          <div className="text-center">
            <p className="text-gray-500">Loading data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="flex items-center justify-between border-b bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="lg:hidden" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
            <p className="text-sm text-gray-500">Generate a new invoice for your customer</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastCreatedInvoice && (
            <Button 
              onClick={handleDownloadPDF}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          )}
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
      </div>

      <div className="p-6">
        {branding && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {branding.logo_url && (
                  <img 
                    src={branding.logo_url} 
                    alt="Company Logo" 
                    className="h-12 w-auto"
                  />
                )}
                <div>
                  <h3 className="font-semibold" style={{ color: branding.primary_color }}>
                    {companyProfile?.company_name || 'Your Company'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Template: {branding.template_id} | Font: {branding.font_family}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="customerNumber">Customer Number</Label>
                <Input
                  id="customerNumber"
                  value={customerNumber}
                  onChange={(e) => setCustomerNumber(e.target.value)}
                  placeholder="Enter customer number"
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-4">
                <div>
                  <Label htmlFor="item">Select Item</Label>
                  <Select value={currentItem.stockItemId} onValueChange={(value) => setCurrentItem({...currentItem, stockItemId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an item" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {stockItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          <div className="flex flex-col">
                            <span>{item.name} - {formatCurrency(item.price)}</span>
                            <span className="text-xs text-gray-500">
                              Stock: {item.quantity} {item.quantity <= 5 ? '⚠️ Low Stock' : ''}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({...currentItem, quantity: e.target.value})}
                    placeholder="Enter quantity"
                  />
                </div>
                <div className="flex items-end">
                  <Button type="button" onClick={addItem} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>

              {stockItems.length === 0 && (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <p>No stock items available</p>
                  <p className="text-sm">Please add stock items first</p>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Invoice Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(item.price)} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold">{formatCurrency(item.total)}</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-3 border-t pt-4">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="discount">Discount (%):</Label>
                      <Input
                        id="discount"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        className="w-20"
                      />
                    </div>
                    <span className="text-red-600">-{formatCurrency(discountAmount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-green-600">{formatCurrency(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4">
            <Button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={selectedItems.length === 0}
            >
              Create Invoice
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInvoice;
