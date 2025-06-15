
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { 
  getUserBranding, 
  saveUserBranding, 
  getCompanyProfile, 
  saveCompanyProfile,
  getInvoiceTemplates,
  uploadLogo,
  UserBranding,
  CompanyProfile,
  InvoiceTemplate
} from "@/utils/supabaseDataManager";
import { Palette, Building, Upload, Eye } from "lucide-react";

const BrandingSettings = () => {
  const [branding, setBranding] = useState<UserBranding | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [brandingData, profileData, templatesData] = await Promise.all([
        getUserBranding(),
        getCompanyProfile(),
        getInvoiceTemplates()
      ]);
      
      setBranding(brandingData);
      setCompanyProfile(profileData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load branding settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const logoUrl = await uploadLogo(file);
      if (logoUrl && branding) {
        setBranding({ ...branding, logo_url: logoUrl });
        toast({
          title: "Success",
          description: "Logo uploaded successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleBrandingSave = async () => {
    if (!branding) return;

    try {
      const updatedBranding = await saveUserBranding({
        logo_url: branding.logo_url,
        primary_color: branding.primary_color,
        secondary_color: branding.secondary_color,
        font_family: branding.font_family,
        template_id: branding.template_id,
      });

      if (updatedBranding) {
        setBranding(updatedBranding);
        toast({
          title: "Success",
          description: "Branding settings saved successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save branding settings",
        variant: "destructive",
      });
    }
  };

  const handleCompanyProfileSave = async () => {
    if (!companyProfile?.company_name) {
      toast({
        title: "Error",
        description: "Company name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedProfile = await saveCompanyProfile({
        company_name: companyProfile.company_name,
        company_address: companyProfile.company_address || '',
        company_phone: companyProfile.company_phone || '',
        company_email: companyProfile.company_email || '',
        tax_id: companyProfile.tax_id || '',
        website: companyProfile.website || '',
      });

      if (updatedProfile) {
        setCompanyProfile(updatedProfile);
        toast({
          title: "Success",
          description: "Company profile saved successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save company profile",
        variant: "destructive",
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
              <h1 className="text-2xl font-bold text-gray-900">Branding Settings</h1>
              <p className="text-sm text-gray-500">Loading...</p>
            </div>
          </div>
          <Palette className="h-8 w-8 text-gray-400" />
        </div>
        <div className="p-6">
          <div className="text-center">
            <p className="text-gray-500">Loading settings...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Branding Settings</h1>
            <p className="text-sm text-gray-500">Customize your invoice templates and branding</p>
          </div>
        </div>
        <Palette className="h-8 w-8 text-gray-400" />
      </div>

      <div className="p-6 space-y-6">
        {/* Company Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={companyProfile?.company_name || ''}
                  onChange={(e) => setCompanyProfile(prev => ({ 
                    ...prev, 
                    company_name: e.target.value 
                  } as CompanyProfile))}
                  placeholder="Enter company name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="companyEmail">Company Email</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={companyProfile?.company_email || ''}
                  onChange={(e) => setCompanyProfile(prev => ({ 
                    ...prev, 
                    company_email: e.target.value 
                  } as CompanyProfile))}
                  placeholder="Enter company email"
                />
              </div>
              <div>
                <Label htmlFor="companyPhone">Company Phone</Label>
                <Input
                  id="companyPhone"
                  value={companyProfile?.company_phone || ''}
                  onChange={(e) => setCompanyProfile(prev => ({ 
                    ...prev, 
                    company_phone: e.target.value 
                  } as CompanyProfile))}
                  placeholder="Enter company phone"
                />
              </div>
              <div>
                <Label htmlFor="taxId">Tax ID</Label>
                <Input
                  id="taxId"
                  value={companyProfile?.tax_id || ''}
                  onChange={(e) => setCompanyProfile(prev => ({ 
                    ...prev, 
                    tax_id: e.target.value 
                  } as CompanyProfile))}
                  placeholder="Enter tax ID"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="companyAddress">Company Address</Label>
                <Input
                  id="companyAddress"
                  value={companyProfile?.company_address || ''}
                  onChange={(e) => setCompanyProfile(prev => ({ 
                    ...prev, 
                    company_address: e.target.value 
                  } as CompanyProfile))}
                  placeholder="Enter company address"
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={companyProfile?.website || ''}
                  onChange={(e) => setCompanyProfile(prev => ({ 
                    ...prev, 
                    website: e.target.value 
                  } as CompanyProfile))}
                  placeholder="Enter website URL"
                />
              </div>
            </div>
            <Button onClick={handleCompanyProfileSave} className="w-full md:w-auto">
              Save Company Information
            </Button>
          </CardContent>
        </Card>

        {/* Branding Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Brand Customization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo Upload */}
            <div>
              <Label htmlFor="logo">Company Logo</Label>
              <div className="flex items-center gap-4 mt-2">
                {branding?.logo_url && (
                  <img 
                    src={branding.logo_url} 
                    alt="Company Logo" 
                    className="h-16 w-16 object-contain border rounded"
                  />
                )}
                <div>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="mb-2"
                  />
                  <p className="text-sm text-gray-500">Upload PNG or JPG (max 2MB)</p>
                </div>
              </div>
            </div>

            {/* Color Settings */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={branding?.primary_color || '#3B82F6'}
                    onChange={(e) => setBranding(prev => ({ 
                      ...prev!, 
                      primary_color: e.target.value 
                    }))}
                    className="w-16 h-10"
                  />
                  <Input
                    value={branding?.primary_color || '#3B82F6'}
                    onChange={(e) => setBranding(prev => ({ 
                      ...prev!, 
                      primary_color: e.target.value 
                    }))}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={branding?.secondary_color || '#EF4444'}
                    onChange={(e) => setBranding(prev => ({ 
                      ...prev!, 
                      secondary_color: e.target.value 
                    }))}
                    className="w-16 h-10"
                  />
                  <Input
                    value={branding?.secondary_color || '#EF4444'}
                    onChange={(e) => setBranding(prev => ({ 
                      ...prev!, 
                      secondary_color: e.target.value 
                    }))}
                    placeholder="#EF4444"
                  />
                </div>
              </div>
            </div>

            {/* Font and Template Selection */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="fontFamily">Font Family</Label>
                <Select value={branding?.font_family || 'Inter'} onValueChange={(value) => setBranding(prev => ({ ...prev!, font_family: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Open Sans">Open Sans</SelectItem>
                    <SelectItem value="Lato">Lato</SelectItem>
                    <SelectItem value="Poppins">Poppins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="template">Invoice Template</Label>
                <Select value={branding?.template_id || 'modern'} onValueChange={(value) => setBranding(prev => ({ ...prev!, template_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} {template.is_premium && '(Premium)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleBrandingSave} className="w-full md:w-auto">
              Save Branding Settings
            </Button>
          </CardContent>
        </Card>

        {/* Template Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Template Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-6 bg-white" style={{ fontFamily: branding?.font_family || 'Inter' }}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  {branding?.logo_url && (
                    <img src={branding.logo_url} alt="Logo" className="h-12 mb-4" />
                  )}
                  <h1 className="text-2xl font-bold" style={{ color: branding?.primary_color || '#3B82F6' }}>
                    INVOICE
                  </h1>
                  <p className="text-gray-600">Invoice #INV-001</p>
                </div>
                <div className="text-right">
                  <h2 className="font-semibold text-lg">{companyProfile?.company_name || 'Your Company'}</h2>
                  <p className="text-gray-600">{companyProfile?.company_address || 'Company Address'}</p>
                  <p className="text-gray-600">{companyProfile?.company_phone || 'Phone Number'}</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold mb-2" style={{ color: branding?.secondary_color || '#EF4444' }}>Bill To:</h3>
                  <p>Customer Name</p>
                  <p className="text-gray-600">Customer Address</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2" style={{ color: branding?.secondary_color || '#EF4444' }}>Invoice Details:</h3>
                  <p>Date: {new Date().toLocaleDateString()}</p>
                  <p>Due Date: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="border rounded">
                <div className="bg-gray-50 p-3 border-b">
                  <div className="grid grid-cols-4 gap-4 font-semibold">
                    <div>Item</div>
                    <div>Quantity</div>
                    <div>Price</div>
                    <div>Total</div>
                  </div>
                </div>
                <div className="p-3">
                  <div className="grid grid-cols-4 gap-4">
                    <div>Sample Product</div>
                    <div>1</div>
                    <div>₹1,000</div>
                    <div>₹1,000</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-right">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹1,000</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg" style={{ color: branding?.primary_color || '#3B82F6' }}>
                    <span>Total:</span>
                    <span>₹1,000</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BrandingSettings;
