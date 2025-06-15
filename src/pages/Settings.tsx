
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getCompanyProfile, saveCompanyProfile, type CompanyProfile } from '@/utils/supabaseDataManager';
import { supabase } from '@/integrations/supabase/client';
import { User, Settings as SettingsIcon } from 'lucide-react';

const companySchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  company_address: z.string().optional(),
  company_phone: z.string().optional(),
  company_email: z.string().email('Invalid email format').optional().or(z.literal('')),
  tax_id: z.string().optional(),
  website: z.string().url('Invalid URL format').optional().or(z.literal('')),
});

const userSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.password && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type CompanyFormData = z.infer<typeof companySchema>;
type UserFormData = z.infer<typeof userSchema>;

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);

  const companyForm = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      company_name: '',
      company_address: '',
      company_phone: '',
      company_email: '',
      tax_id: '',
      website: '',
    },
  });

  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: user?.email || '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    loadCompanyProfile();
    if (user?.email) {
      userForm.setValue('email', user.email);
    }
  }, [user]);

  const loadCompanyProfile = async () => {
    try {
      const profile = await getCompanyProfile();
      if (profile) {
        setCompanyProfile(profile);
        companyForm.reset({
          company_name: profile.company_name,
          company_address: profile.company_address || '',
          company_phone: profile.company_phone || '',
          company_email: profile.company_email || '',
          tax_id: profile.tax_id || '',
          website: profile.website || '',
        });
      }
    } catch (error) {
      console.error('Error loading company profile:', error);
    }
  };

  const onCompanySubmit = async (data: CompanyFormData) => {
    setLoading(true);
    try {
      const result = await saveCompanyProfile({
        company_name: data.company_name,
        company_address: data.company_address || null,
        company_phone: data.company_phone || null,
        company_email: data.company_email || null,
        tax_id: data.tax_id || null,
        website: data.website || null,
      });

      if (result) {
        setCompanyProfile(result);
        toast({
          title: "Success",
          description: "Company information updated successfully",
        });
      } else {
        throw new Error('Failed to save company profile');
      }
    } catch (error) {
      console.error('Error saving company profile:', error);
      toast({
        title: "Error",
        description: "Failed to update company information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onUserSubmit = async (data: UserFormData) => {
    setLoading(true);
    try {
      // Update email if changed
      if (data.email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: data.email,
        });
        if (emailError) throw emailError;
      }

      // Update password if provided
      if (data.password && data.password.length > 0) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: data.password,
        });
        if (passwordError) throw passwordError;
      }

      toast({
        title: "Success",
        description: "User credentials updated successfully",
      });

      // Clear password fields
      userForm.setValue('password', '');
      userForm.setValue('confirmPassword', '');
    } catch (error: any) {
      console.error('Error updating user credentials:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        </div>
        <p className="text-gray-600">Manage your account and company information</p>
      </div>

      <div className="space-y-8">
        {/* User Credentials Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <CardTitle>User Credentials</CardTitle>
            </div>
            <CardDescription>
              Update your email and password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    {...userForm.register('email')}
                    className="w-full"
                  />
                  {userForm.formState.errors.email && (
                    <p className="text-sm text-red-600">{userForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">New Password (optional)</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Leave blank to keep current password"
                    {...userForm.register('password')}
                    className="w-full"
                  />
                  {userForm.formState.errors.password && (
                    <p className="text-sm text-red-600">{userForm.formState.errors.password.message}</p>
                  )}
                </div>
              </div>
              
              {userForm.watch('password') && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    {...userForm.register('confirmPassword')}
                    className="w-full"
                  />
                  {userForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-600">{userForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full md:w-auto">
                {loading ? 'Updating...' : 'Update Credentials'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Separator />

        {/* Company Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Manage your business details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    {...companyForm.register('company_name')}
                    className="w-full"
                    placeholder="Enter company name"
                  />
                  {companyForm.formState.errors.company_name && (
                    <p className="text-sm text-red-600">{companyForm.formState.errors.company_name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_email">Company Email</Label>
                  <Input
                    id="company_email"
                    type="email"
                    {...companyForm.register('company_email')}
                    className="w-full"
                    placeholder="company@example.com"
                  />
                  {companyForm.formState.errors.company_email && (
                    <p className="text-sm text-red-600">{companyForm.formState.errors.company_email.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_address">Company Address</Label>
                <Textarea
                  id="company_address"
                  {...companyForm.register('company_address')}
                  className="w-full"
                  placeholder="Enter complete business address"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_phone">Phone Number</Label>
                  <Input
                    id="company_phone"
                    {...companyForm.register('company_phone')}
                    className="w-full"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_id">Tax ID</Label>
                  <Input
                    id="tax_id"
                    {...companyForm.register('tax_id')}
                    className="w-full"
                    placeholder="Enter tax identification number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  {...companyForm.register('website')}
                  className="w-full"
                  placeholder="https://www.yourcompany.com"
                />
                {companyForm.formState.errors.website && (
                  <p className="text-sm text-red-600">{companyForm.formState.errors.website.message}</p>
                )}
              </div>

              <Button type="submit" disabled={loading} className="w-full md:w-auto">
                {loading ? 'Saving...' : 'Save Company Information'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
