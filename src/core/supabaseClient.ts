import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useSettingsStore } from './store/useSettingsStore';
import { decryptData } from '../utils/encryption';

let supabaseInstance: SupabaseClient | null = null;
let isInitializing = false;

export const initSupabase = async (): Promise<SupabaseClient | null> => {
  const { supabaseUrl, supabaseAnonKey } = useSettingsStore.getState();
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  // If already matches
  if (supabaseInstance && (supabaseInstance as any).supabaseUrl === supabaseUrl) {
    return supabaseInstance;
  }

  if (isInitializing) return null; // Avoid concurrent initialization races
  isInitializing = true;

  try {
    // Attempt to decrypt the anon key securely
    const plainKey = await decryptData(supabaseAnonKey);
    supabaseInstance = createClient(supabaseUrl, plainKey);
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
    supabaseInstance = null;
  } finally {
    isInitializing = false;
  }

  return supabaseInstance;
};

export const getSupabase = (): SupabaseClient | null => {
  return supabaseInstance;
};

// --- CLOUD SYNC OPERATIONS ---

export const checkCloudConnection = async (): Promise<{ success: boolean; needsSetup?: boolean; error?: string }> => {
  const supabase = await initSupabase();
  if (!supabase) return { success: false, error: 'Not configured' };
  
  // Attempt to select 1 row from documents to verify table exists
  const { error } = await supabase.from('documents').select('id').limit(1);
  if (error) {
    if (error.code === '42P01' || error.message.includes('schema cache')) {
      return { success: false, needsSetup: true, error: 'Database table missing' };
    }
    return { success: false, error: error.message };
  }
  return { success: true };
};

export const uploadDocumentToCloud = async (doc: any): Promise<{ success: boolean; error?: string }> => {
  const supabase = await initSupabase();
  if (!supabase) return { success: false };
  
  const { error } = await supabase.from('documents').upsert({
    id: doc.id,
    title: doc.title,
    type: doc.type,
    data: doc.data,
    updated_at: new Date(doc.updatedAt).toISOString()
  });
  
  if (error) {
    console.error('Failed to upload to cloud:', error); return { success: false, error: error.message };
    return { success: false };
  }
  return { success: true };
};

export const deleteDocumentFromCloud = async (id: string): Promise<{ success: boolean; error?: string }> => {
  const supabase = await initSupabase();
  if (!supabase) return { success: false };
  
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) {
    console.error('Failed to delete from cloud:', error);
    return { success: false };
  }
  return { success: true };
};

export const syncDocumentFromCloud = async (id: string): Promise<any | null> => {
  const supabase = await initSupabase();
  if (!supabase) return null;
  
  const { data, error } = await supabase.from('documents').select('*').eq('id', id).single();
  if (error) {
    console.error('Failed to sync from cloud:', error);
    return null;
  }
  
  if (data) {
    return {
      id: data.id,
      title: data.title,
      type: data.type,
      updatedAt: new Date(data.updated_at).getTime(),
      data: data.data,
      isCloudLinked: true,
      cloudUpdatedAt: new Date(data.updated_at).getTime()
    };
  }
  return null;
};

export const listDocumentsFromCloud = async (): Promise<any[]> => {
  const supabase = await initSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.from('documents').select('id, title, type, updated_at').order('updated_at', { ascending: false });
  if (error) {
    console.error('Failed to list from cloud', error);
    return [];
  }
  return data || [];
};
