export interface Campaign {
  id: string;
  name: string;
  objective: string;
  audience_rules?: any;
  message: string;
  audience_size: number;
  sent: number;
  delivered: number;
  failed: number;
  status: string;
  created_at: string;
}
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
}

export interface Communication {
  id: string;
  campaign_id: string;
  customer_id: string;
  message: string;
  status: 'sent' | 'delivered' | 'failed';
  sent_at: string;
  delivery_receipt_at?: string;
}

export interface Order {
  id: string;
  customer_id: string;
  order_date: string;
  total_amount: number;
  status: string;
  // Add other fields as needed based on your 'orders' table schema
}

// DatabaseService class implementation
class DatabaseService {
  async getCustomerByEmail(email: string): Promise<Customer | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch customer by email: ${error.message}`);
    }
    return data || null;
  }
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLIC_ANON_KEY) as string | undefined;

    if (!supabaseUrl) {
      console.error('❌ Missing SUPABASE_URL in environment variables');
      throw new Error('Missing Supabase URL configuration');
    }

    if (!serviceKey && !anonKey) {
      console.error('❌ Missing both SUPABASE_SERVICE_KEY and SUPABASE_ANON_KEY');
      throw new Error('Missing Supabase authentication keys');
    }

    let authKey = serviceKey || anonKey!;
    const usingService = !!serviceKey;

    if (!serviceKey && anonKey) {
      console.warn('⚠️ Using anon key instead of service key. Some admin operations may fail.');
    }

    console.log('🔗 Connecting to Supabase...');
    console.log('📍 URL:', supabaseUrl);
    console.log('🔑 Key Type:', usingService ? 'service_role' : 'anon');
    console.log('🔑 Key Preview:', authKey.substring(0, 16) + '...');

    this.supabase = createClient(supabaseUrl, authKey);
    console.log('✅ Supabase client initialized');
  }

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }

    return data || [];
  }

  async createCustomer(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
    const { data, error } = await this.supabase
      .from('customers')
      .insert([{ ...customer, created_at: new Date().toISOString() }])
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create customer: ${error.message}`);
    }

    return data;
  }

  async upsertCustomer(customer: { email: string; name: string; phone?: string }): Promise<Customer> {
    const { data, error } = await this.supabase
      .from('customers')
      .upsert([{ 
        email: customer.email, 
        name: customer.name,
        phone: customer.phone || null,
        created_at: new Date().toISOString() 
      }], { 
        onConflict: 'email',
        ignoreDuplicates: false 
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to upsert customer: ${error.message}`);
    }

    return data;
  }

  // Order operations
  async getOrders(customerId?: string): Promise<Order[]> {
    let query = this.supabase
      .from('orders')
      .select('*')
      .order('order_date', { ascending: false });

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    return data || [];
  }

  async createOrder(order: Omit<Order, 'id'>): Promise<Order> {
    const { data, error } = await this.supabase
      .from('orders')
      .insert([order])
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }

    return data;
  }

  // Campaign operations
  async getCampaigns(): Promise<Campaign[]> {
    const { data, error } = await this.supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch campaigns: ${error.message}`);
    }

    return data || [];
  }

  async createCampaign(campaign: Omit<Campaign, 'id' | 'created_at'>): Promise<Campaign> {
    const campaignData = {
      ...campaign,
      status: campaign.status || 'draft',
      created_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('campaigns')
      .insert([campaignData])
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create campaign: ${error.message}`);
    }

    return data;
  }

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign> {
    const { data, error } = await this.supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update campaign: ${error.message}`);
    }

    return data;
  }

  // Communication operations
  async logCommunication(communication: Omit<Communication, 'id'>): Promise<Communication> {
    const { data, error } = await this.supabase
      .from('communication_log')
      .insert([communication])
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to log communication: ${error.message}`);
    }

    return data;
  }

  async getCommunications(campaignId?: string): Promise<Communication[]> {
    let query = this.supabase
      .from('communication_log')
      .select('*')
      .order('sent_at', { ascending: false });

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch communications: ${error.message}`);
    }

    return data || [];
  }

  // User operations for authentication
  async upsertUser(userData: {
    google_id: string;
    email: string;
    name: string;
    avatar_url?: string;
  }): Promise<any> {
    const { data, error } = await this.supabase
      .from('users')
      .upsert([{
        ...userData,
        last_login: new Date().toISOString()
      }])
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to upsert user: ${error.message}`);
    }

    return data;
  }
}

// Lazy initialization to ensure environment variables are loaded
let _databaseService: DatabaseService | null = null;

export const databaseService = {
  getInstance(): DatabaseService {
    if (!_databaseService) {
      _databaseService = new DatabaseService();
    }
    return _databaseService;
  }
};

// Helper function for backwards compatibility
export const getDatabaseService = () => databaseService.getInstance();
