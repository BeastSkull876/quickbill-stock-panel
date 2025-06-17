
import { hostingerService } from '@/services/hostingerService';
import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/utils/supabaseDataManager';

export interface SyncOptions {
  syncToHostinger?: boolean;
  syncFromHostinger?: boolean;
}

export class DataSyncManager {
  // Sync invoice to Hostinger after creating in Supabase
  static async syncInvoiceToHostinger(invoice: Invoice) {
    try {
      const hostingerData = {
        supabase_id: invoice.id,
        customer_name: invoice.customer_name,
        customer_number: invoice.customer_number,
        total: invoice.total,
        items: invoice.items,
        created_at: invoice.created_at,
        user_id: invoice.user_id
      };

      const result = await hostingerService.syncInvoiceToHostinger(hostingerData);
      
      if (result.success) {
        console.log('Invoice synced to Hostinger successfully');
        return result.data;
      } else {
        console.error('Failed to sync to Hostinger:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Sync error:', error);
      throw error;
    }
  }

  // Get reports from Hostinger database
  static async getHostingerReports() {
    try {
      const result = await hostingerService.getHostingerReports();
      
      if (result.success) {
        return result.data;
      } else {
        console.error('Failed to fetch Hostinger reports:', result.error);
        return [];
      }
    } catch (error) {
      console.error('Error fetching Hostinger reports:', error);
      return [];
    }
  }

  // Sync user data between databases
  static async syncUserData(userData: any) {
    try {
      const result = await hostingerService.createRecord('users', userData);
      return result.success;
    } catch (error) {
      console.error('Error syncing user data:', error);
      return false;
    }
  }
}
