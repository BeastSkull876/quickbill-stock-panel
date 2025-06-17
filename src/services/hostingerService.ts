
import { databaseConfig } from '@/config/database';

export interface HostingerApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class HostingerService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = databaseConfig.hostinger.apiUrl;
    this.apiKey = databaseConfig.hostinger.apiKey;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<HostingerApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'API request failed'
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Example methods for common operations
  async createRecord(table: string, data: Record<string, any>) {
    return this.makeRequest(`/${table}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRecords(table: string, params?: Record<string, string>) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.makeRequest(`/${table}${queryString}`);
  }

  async updateRecord(table: string, id: string, data: Record<string, any>) {
    return this.makeRequest(`/${table}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRecord(table: string, id: string) {
    return this.makeRequest(`/${table}/${id}`, {
      method: 'DELETE',
    });
  }

  // Custom methods for specific use cases
  async syncInvoiceToHostinger(invoiceData: any) {
    return this.createRecord('invoices', invoiceData);
  }

  async getHostingerReports() {
    return this.getRecords('reports');
  }
}

export const hostingerService = new HostingerService();
