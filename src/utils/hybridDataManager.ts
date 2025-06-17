
import { 
  saveInvoice as supabaseSaveInvoice,
  Invoice,
  StockItem
} from '@/utils/supabaseDataManager';
import { DataSyncManager } from '@/utils/dataSyncManager';

export interface HybridSaveOptions {
  syncToHostinger?: boolean;
}

// Enhanced save invoice that can sync to both databases
export const saveInvoiceHybrid = async (
  invoice: Omit<Invoice, 'id' | 'created_at' | 'user_id'>, 
  stockItemsMap?: Map<string, StockItem>,
  options: HybridSaveOptions = {}
): Promise<Invoice | null> => {
  try {
    // First save to Supabase (primary database)
    const savedInvoice = await supabaseSaveInvoice(invoice, stockItemsMap);
    
    if (!savedInvoice) {
      throw new Error('Failed to save invoice to Supabase');
    }

    // Optionally sync to Hostinger
    if (options.syncToHostinger) {
      try {
        await DataSyncManager.syncInvoiceToHostinger(savedInvoice);
        console.log('Invoice synced to Hostinger successfully');
      } catch (syncError) {
        console.error('Failed to sync to Hostinger, but invoice saved to Supabase:', syncError);
        // Don't fail the operation if Hostinger sync fails
      }
    }

    return savedInvoice;
  } catch (error) {
    console.error('Error in hybrid save operation:', error);
    throw error;
  }
};

// Re-export other functions from supabaseDataManager
export * from '@/utils/supabaseDataManager';
