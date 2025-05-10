
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qpahynondwttnedmfhkv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwYWh5bm9uZHd0dG5lZG1maGt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU0NDc4NTYsImV4cCI6MjAzMTAyMzg1Nn0.uxxwO-oa3MbGyXFXaQCSv5qgQ0D1UdgtDA9u-3izLzE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Product = {
  id?: number;
  produto: string;
  corredor: number;
  loja?: string;
};

export type PantryItem = {
  id?: string;
  product_name: string;
  quantity: number;
  expiration_date: string | null;
};
