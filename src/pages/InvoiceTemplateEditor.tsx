
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { 
  getUserBranding, 
  saveUserBranding, 
  getCompanyProfile,
  UserBranding, 
  CompanyProfile 
} from "@/utils/supabaseDataManager";
import { generateInvoicePDF } from "@/components/InvoicePDFGenerator";
import { Palette, Eye, Save, FileText } from "lucide-react";

interface InvoiceTemplateSettings {
  showCompanyLogo: boolean;
  showCompanyAddress: boolean;
  showCompanyPhone: boolean;
  showCompanyEmail: boolean;
  showWebsite: boolean;
  showTaxId: boolean;
  headerBackgroundEnabled: boolean;
  alternatingRowColors: boolean;
  showFooter: boolean;
  footerText: string;
  invoiceNumberPrefix: string;
  dateFormat: string;
  currencySymbol: string;
  fontSize: string;
  lineSpacing: string;
}

const InvoiceTemplateEditor = () => {
  const [branding, setBranding] = useState<UserBranding | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [templateSettings, setTemplateSettings] = useState<InvoiceTemplateSettings>({
    showCompanyLogo: true,
    showCompanyAddress: true,
    showCompanyPhone: true,
    showCompanyEmail: true,
    showWebsite: true,
    showTaxId: true,
    headerBackgroundEnabled: true,
    alternatingRowColors: true,
    showFooter: true,
    footerText: "Thank you for your business!",
    invoiceNumberPrefix: "INV-",
    dateFormat: "MM/DD/YYYY",
    currencySymbol: "₹",
    fontSize: "normal",
    lineSpacing: "normal"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [brandingData, profileData] = await Promise.all([
        getUserBranding(),
        getCompanyProfile()
      ]);
      
      setBranding(brandingData);
      setCompanyProfile(profileData);
      
      // Load template settings from branding data if available
      if (brandingData && brandingData.template_settings) {
        setTemplateSettings({
          ...templateSettings,
          ...JSON.parse(brandingData.template_settings)
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load template settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBrandingChange = (field: keyof UserBranding, value: string) => {
    setBranding(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleTemplateSettingChange = (field: keyof InvoiceTemplateSettings, value: boolean | string) => {
    setTemplateSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async () => {
    if (!branding) return;
    
    setSaving(true);
    try {
      const updatedBranding = {
        ...branding,
        template_settings: JSON.stringify(templateSettings)
      };
      
      await saveUserBranding(updatedBranding);
      setBranding(updatedBranding);
      
      toast({
        title: "Success",
        description: "Template settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save template settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewPDF = () => {
    if (!branding || !companyProfile) {
      toast({
        title: "Error",
        description: "Missing branding or company profile data",
        variant: "destructive",
      });
      return;
    }

    // Create a sample invoice for preview
    const sampleInvoice = {
      id: "sample-preview-invoice",
      customer_name: "Sample Customer",
      customer_number: "+91 9876543210",
      subtotal: 1000,
      discount: 10,
      total: 900,
      created_at: new Date().toISOString(),
      user_id: "sample",
      items: [
        {
          id: "sample-item-1",
          name: "Sample Product 1",
          price: 500,
          quantity: 1,
          total: 500
        },
        {
          id: "sample-item-2",
          name: "Sample Product 2", 
          price: 500,
          quantity: 1,
          total: 500
        }
      ]
    };

    const updatedBranding = {
      ...branding,
      template_settings: JSON.stringify(templateSettings)
    };

    generateInvoicePDF({
      invoice: sampleInvoice,
      branding: updatedBranding,
      companyProfile,
      isPreview: true
    });
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="flex items-center justify-between border-b bg-white px-6 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invoice Template Editor</h1>
              <p className="text-sm text-gray-500">Loading...</p>
            </div>
          </div>
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
        <div className="p-6">
          <div className="text-center">
            <p className="text-gray-500">Loading template settings...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Invoice Template Editor</h1>
            <p className="text-sm text-gray-500">Customize your printable invoice format</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePreviewPDF} variant="outline" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview PDF
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Colors & Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Colors & Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={branding?.primary_color || "#3B82F6"}
                    onChange={(e) => handleBrandingChange('primary_color', e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    value={branding?.primary_color || "#3B82F6"}
                    onChange={(e) => handleBrandingChange('primary_color', e.target.value)}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={branding?.secondary_color || "#EF4444"}
                    onChange={(e) => handleBrandingChange('secondary_color', e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    value={branding?.secondary_color || "#EF4444"}
                    onChange={(e) => handleBrandingChange('secondary_color', e.target.value)}
                    placeholder="#EF4444"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="fontFamily">Font Family</Label>
              <Select 
                value={branding?.font_family || "Inter"} 
                onValueChange={(value) => handleBrandingChange('font_family', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Layout & Content Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Layout & Content Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Company Information Display</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showCompanyLogo">Show Company Logo</Label>
                    <Switch
                      id="showCompanyLogo"
                      checked={templateSettings.showCompanyLogo}
                      onCheckedChange={(checked) => handleTemplateSettingChange('showCompanyLogo', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showCompanyAddress">Show Company Address</Label>
                    <Switch
                      id="showCompanyAddress"
                      checked={templateSettings.showCompanyAddress}
                      onCheckedChange={(checked) => handleTemplateSettingChange('showCompanyAddress', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showCompanyPhone">Show Company Phone</Label>
                    <Switch
                      id="showCompanyPhone"
                      checked={templateSettings.showCompanyPhone}
                      onCheckedChange={(checked) => handleTemplateSettingChange('showCompanyPhone', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showCompanyEmail">Show Company Email</Label>
                    <Switch
                      id="showCompanyEmail"
                      checked={templateSettings.showCompanyEmail}
                      onCheckedChange={(checked) => handleTemplateSettingChange('showCompanyEmail', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showWebsite">Show Website</Label>
                    <Switch
                      id="showWebsite"
                      checked={templateSettings.showWebsite}
                      onCheckedChange={(checked) => handleTemplateSettingChange('showWebsite', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showTaxId">Show Tax ID</Label>
                    <Switch
                      id="showTaxId"
                      checked={templateSettings.showTaxId}
                      onCheckedChange={(checked) => handleTemplateSettingChange('showTaxId', checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Visual Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="headerBackgroundEnabled">Header Background</Label>
                    <Switch
                      id="headerBackgroundEnabled"
                      checked={templateSettings.headerBackgroundEnabled}
                      onCheckedChange={(checked) => handleTemplateSettingChange('headerBackgroundEnabled', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="alternatingRowColors">Alternating Row Colors</Label>
                    <Switch
                      id="alternatingRowColors"
                      checked={templateSettings.alternatingRowColors}
                      onCheckedChange={(checked) => handleTemplateSettingChange('alternatingRowColors', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showFooter">Show Footer</Label>
                    <Switch
                      id="showFooter"
                      checked={templateSettings.showFooter}
                      onCheckedChange={(checked) => handleTemplateSettingChange('showFooter', checked)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoiceNumberPrefix">Invoice Number Prefix</Label>
                <Input
                  id="invoiceNumberPrefix"
                  value={templateSettings.invoiceNumberPrefix}
                  onChange={(e) => handleTemplateSettingChange('invoiceNumberPrefix', e.target.value)}
                  placeholder="INV-"
                />
              </div>
              <div>
                <Label htmlFor="currencySymbol">Currency Symbol</Label>
                <Input
                  id="currencySymbol"
                  value={templateSettings.currencySymbol}
                  onChange={(e) => handleTemplateSettingChange('currencySymbol', e.target.value)}
                  placeholder="₹"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="footerText">Footer Text</Label>
              <Textarea
                id="footerText"
                value={templateSettings.footerText}
                onChange={(e) => handleTemplateSettingChange('footerText', e.target.value)}
                placeholder="Thank you for your business!"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select 
                  value={templateSettings.dateFormat} 
                  onValueChange={(value) => handleTemplateSettingChange('dateFormat', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fontSize">Font Size</Label>
                <Select 
                  value={templateSettings.fontSize} 
                  onValueChange={(value) => handleTemplateSettingChange('fontSize', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="lineSpacing">Line Spacing</Label>
                <Select 
                  value={templateSettings.lineSpacing} 
                  onValueChange={(value) => handleTemplateSettingChange('lineSpacing', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="relaxed">Relaxed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoiceTemplateEditor;
