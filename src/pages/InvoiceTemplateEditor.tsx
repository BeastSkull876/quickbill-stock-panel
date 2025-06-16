import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Invoice } from "@/utils/supabaseDataManager";

const InvoiceTemplateEditor = () => {
  const [primaryColor, setPrimaryColor] = React.useState("#000000");
  const [secondaryColor, setSecondaryColor] = React.useState("#FFFFFF");
  const [fontFamily, setFontFamily] = React.useState("Arial");
  const [templateId, setTemplateId] = React.useState("template-1");
  const [logoUrl, setLogoUrl] = React.useState("");
  const [templateSettings, setTemplateSettings] = React.useState("");

  const handlePrimaryColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPrimaryColor(event.target.value);
  };

  const handleSecondaryColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSecondaryColor(event.target.value);
  };

  const handleFontFamilyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFontFamily(event.target.value);
  };

  const handleTemplateIdChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTemplateId(event.target.value);
  };

  const handleLogoUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLogoUrl(event.target.value);
  };

  const handleTemplateSettingsChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTemplateSettings(event.target.value);
  };

  const mockInvoice: Invoice = {
    id: "INV-001",
    customer_name: "John Doe",
    customer_number: "+91 98765 43210",
    subtotal: 1150.00,
    discount: 10,
    total: 1035.00,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: "mock-user-id",
    items: [
      {
        id: "1",
        name: "Premium Widget",
        price: 500.00,
        quantity: 2,
        total: 1000.00
      },
      {
        id: "2",
        name: "Standard Service",
        price: 150.00,
        quantity: 1,
        total: 150.00
      }
    ]
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Invoice Template Editor</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primaryColor">Primary Color</Label>
              <Input
                type="color"
                id="primaryColor"
                value={primaryColor}
                onChange={handlePrimaryColorChange}
              />
            </div>
            <div>
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <Input
                type="color"
                id="secondaryColor"
                value={secondaryColor}
                onChange={handleSecondaryColorChange}
              />
            </div>
            <div>
              <Label htmlFor="fontFamily">Font Family</Label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Courier New">Courier New</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="templateId">Template ID</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="template-1">Template 1</SelectItem>
                  <SelectItem value="template-2">Template 2</SelectItem>
                  <SelectItem value="template-3">Template 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                type="text"
                id="logoUrl"
                value={logoUrl}
                onChange={handleLogoUrlChange}
                placeholder="Enter logo URL"
              />
            </div>
            <div>
              <Label htmlFor="templateSettings">Template Settings</Label>
              <Textarea
                id="templateSettings"
                value={templateSettings}
                onChange={handleTemplateSettingsChange}
                placeholder="Enter template settings (JSON)"
              />
            </div>
          </div>
          <div>
            <Button>Save Template</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="invoice-preview">
            <h1 style={{ color: primaryColor, fontFamily: fontFamily }}>Invoice</h1>
            <p>Customer: {mockInvoice.customer_name}</p>
            <p>Invoice ID: {mockInvoice.id}</p>

            <Table>
              <TableCaption>A list of your recent invoices.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockInvoice.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.price}</TableCell>
                    <TableCell className="text-right">{item.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3}>Subtotal</TableCell>
                  <TableCell className="text-right">{mockInvoice.subtotal}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}>Discount</TableCell>
                  <TableCell className="text-right">{mockInvoice.discount}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell className="text-right">{mockInvoice.total}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceTemplateEditor;
