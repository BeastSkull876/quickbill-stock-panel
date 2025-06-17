
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Database, Cloud, Settings } from 'lucide-react';

interface SyncSettings {
  hostingerApiUrl: string;
  hostingerApiKey: string;
  syncInvoices: boolean;
  syncUsers: boolean;
  autoSync: boolean;
}

const DatabaseSyncSettings = () => {
  const [settings, setSettings] = useState<SyncSettings>({
    hostingerApiUrl: localStorage.getItem('hostinger_api_url') || '',
    hostingerApiKey: localStorage.getItem('hostinger_api_key') || '',
    syncInvoices: localStorage.getItem('sync_invoices') === 'true',
    syncUsers: localStorage.getItem('sync_users') === 'true',
    autoSync: localStorage.getItem('auto_sync') === 'true',
  });

  const { toast } = useToast();

  const handleSave = () => {
    localStorage.setItem('hostinger_api_url', settings.hostingerApiUrl);
    localStorage.setItem('hostinger_api_key', settings.hostingerApiKey);
    localStorage.setItem('sync_invoices', settings.syncInvoices.toString());
    localStorage.setItem('sync_users', settings.syncUsers.toString());
    localStorage.setItem('auto_sync', settings.autoSync.toString());

    toast({
      title: "Settings Saved",
      description: "Database sync settings have been updated",
    });
  };

  const testConnection = async () => {
    if (!settings.hostingerApiUrl || !settings.hostingerApiKey) {
      toast({
        title: "Missing Configuration",
        description: "Please provide API URL and key before testing",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`${settings.hostingerApiUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${settings.hostingerApiKey}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Connection Successful",
          description: "Successfully connected to Hostinger database",
        });
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Could not connect to Hostinger database",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Database Sync Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <div>
            <Label htmlFor="apiUrl">Hostinger API URL</Label>
            <Input
              id="apiUrl"
              placeholder="https://your-hostinger-api.com/api"
              value={settings.hostingerApiUrl}
              onChange={(e) => setSettings({...settings, hostingerApiUrl: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Your Hostinger API key"
              value={settings.hostingerApiKey}
              onChange={(e) => setSettings({...settings, hostingerApiKey: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <Label>Sync Invoices to Hostinger</Label>
            </div>
            <Switch
              checked={settings.syncInvoices}
              onCheckedChange={(checked) => setSettings({...settings, syncInvoices: checked})}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              <Label>Sync Users to Hostinger</Label>
            </div>
            <Switch
              checked={settings.syncUsers}
              onCheckedChange={(checked) => setSettings({...settings, syncUsers: checked})}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <Label>Auto Sync (Real-time)</Label>
            </div>
            <Switch
              checked={settings.autoSync}
              onCheckedChange={(checked) => setSettings({...settings, autoSync: checked})}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={testConnection} variant="outline">
            Test Connection
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseSyncSettings;
