import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getInvoices, deleteInvoice, formatCurrency, formatDate, Invoice, getUserBranding, getCompanyProfile, UserBranding, CompanyProfile } from "@/utils/supabaseDataManager";
import { generateInvoicePDF } from "@/components/InvoicePDFGenerator";
import { Receipt, Search, Eye, Download, Printer, Trash2 } from "lucide-react";

const InvoiceList = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [branding, setBranding] = useState<UserBranding | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invoiceData, brandingData, profileData] = await Promise.all([
        getInvoices(),
        getUserBranding(),
        getCompanyProfile()
      ]);
      
      setInvoices(invoiceData);
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

  const filteredInvoices = invoices.filter(invoice =>
    invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customer_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteInvoice(id);
      if (success) {
        setInvoices(prev => prev.filter(invoice => invoice.id !== id));
        toast({
          title: "Success",
          description: "Invoice deleted successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (invoice: Invoice) => {
    try {
      await generateInvoicePDF({
        invoice,
        branding,
        companyProfile
      });
      
      toast({
        title: "Success",
        description: "Invoice PDF generated successfully",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const handlePrint = (invoice: Invoice) => {
    const printContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="text-align: center; color: #333;">INVOICE</h1>
        <div style="margin: 20px 0;">
          <p><strong>Customer:</strong> ${invoice.customer_name}</p>
          <p><strong>Phone:</strong> ${invoice.customer_number}</p>
          <p><strong>Date:</strong> ${formatDate(invoice.created_at)}</p>
          <p><strong>Invoice ID:</strong> ${invoice.id}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Item</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Qty</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Price</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.name}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(item.price)}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(item.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-top: 20px; text-align: right;">
          <p><strong>Subtotal: ${formatCurrency(invoice.subtotal)}</strong></p>
          <p><strong>Discount: ${invoice.discount}%</strong></p>
          <p style="font-size: 18px; color: #333;"><strong>Total: ${formatCurrency(invoice.total)}</strong></p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }

    toast({
      title: "Success",
      description: "Invoice sent to printer",
    });
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="flex items-center justify-between border-b bg-white px-6 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invoice List</h1>
              <p className="text-sm text-gray-500">Loading invoices...</p>
            </div>
          </div>
          <Receipt className="h-8 w-8 text-gray-400" />
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
            <h1 className="text-2xl font-bold text-gray-900">Invoice List</h1>
            <p className="text-sm text-gray-500">View, download, and manage your invoices</p>
          </div>
        </div>
        <Receipt className="h-8 w-8 text-gray-400" />
      </div>

      <div className="p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by customer name or number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredInvoices.length > 0 ? (
          <div className="grid gap-4">
            {filteredInvoices.map((invoice) => (
              <Card key={invoice.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{invoice.customer_name}</CardTitle>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setSelectedInvoice(invoice)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Invoice Details</DialogTitle>
                          </DialogHeader>
                          {selectedInvoice && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p><strong>Customer:</strong> {selectedInvoice.customer_name}</p>
                                  <p><strong>Phone:</strong> {selectedInvoice.customer_number}</p>
                                </div>
                                <div>
                                  <p><strong>Date:</strong> {formatDate(selectedInvoice.created_at)}</p>
                                  <p><strong>Invoice ID:</strong> {selectedInvoice.id}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Items:</h4>
                                <div className="space-y-2">
                                  {selectedInvoice.items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                      <span>{item.name}</span>
                                      <span>{formatCurrency(item.price)} × {item.quantity} = {formatCurrency(item.total)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="border-t pt-4 space-y-2">
                                <div className="flex justify-between">
                                  <span>Subtotal:</span>
                                  <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Discount:</span>
                                  <span>{selectedInvoice.discount}%</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg">
                                  <span>Total:</span>
                                  <span className="text-green-600">{formatCurrency(selectedInvoice.total)}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" variant="outline" onClick={() => handleDownload(invoice)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handlePrint(invoice)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(invoice.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{invoice.customer_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">{formatDate(invoice.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Items</p>
                      <p className="font-medium">{invoice.items.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="font-bold text-green-600">{formatCurrency(invoice.total)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Receipt className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? "No invoices found" : "No invoices yet"}
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? "Try adjusting your search terms" 
                  : "Create your first invoice to see it here"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InvoiceList;
