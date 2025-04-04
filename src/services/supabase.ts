import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function createContentSource(data: {
  type: string;
  metadata: any;
}) {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) {
    throw new Error('User must be authenticated');
  }

  try {
    const { data: source, error } = await supabase
      .from('content_sources')
      .insert([{
        user_id: session.session.user.id,
        type: data.type,
        metadata: data.metadata,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!source) {
      throw new Error('Failed to create content source');
    }

    return source;
  } catch (error: any) {
    console.error('Error creating content source:', error);
    throw new Error(error.message || 'Failed to create content source');
  }
}

export async function updateContentStatus(id: string, status: string) {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) {
    throw new Error('User must be authenticated');
  }

  const { data, error } = await supabase
    .from('content_sources')
    .update({ status })
    .eq('id', id)
    .eq('user_id', session.session.user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addProcessingHistory(data: {
  sourceId: string;
  action: 'import' | 'transform' | 'export' | 'status_update';
  status: 'success' | 'error';
  details: string;
  metadata?: any;
}) {
  const { error } = await supabase
    .from('processing_history')
    .insert([{
      source_id: data.sourceId,
      action: data.action,
      status: data.status,
      details: data.details,
      metadata: data.metadata
    }]);

  if (error) throw error;
}

export async function saveGeneratedContent(data: {
  sourceId: string;
  content: any;
  metadata?: any;
}) {
  const { data: result, error } = await supabase
    .from('generated_content')
    .insert([{
      source_id: data.sourceId,
      content: data.content,
      metadata: data.metadata
    }])
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getGeneratedContent(sourceId: string) {
  const { data, error } = await supabase
    .from('generated_content')
    .select('*')
    .eq('source_id', sourceId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // Ignore not found error
  return data;
}

export async function getContentSources() {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) {
    throw new Error('User must be authenticated');
  }

  const { data, error } = await supabase
    .from('content_sources')
    .select(`
      *,
      processing_history (*)
    `)
    .eq('user_id', session.session.user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}