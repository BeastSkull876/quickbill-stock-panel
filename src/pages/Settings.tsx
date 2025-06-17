
import React from 'react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import DatabaseSyncSettings from "@/components/DatabaseSyncSettings";
import { Settings as SettingsIcon } from "lucide-react";

const Settings = () => {
  return (
    <div className="flex-1 overflow-auto">
      <div className="flex items-center justify-between border-b bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="lg:hidden" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500">Manage your application settings and database sync</p>
          </div>
        </div>
        <SettingsIcon className="h-8 w-8 text-gray-400" />
      </div>

      <div className="p-6">
        <DatabaseSyncSettings />
      </div>
    </div>
  );
};

export default Settings;
