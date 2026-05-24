'use client';

import { supabase, useSupabase } from './supabase';

const db = (table: string) => (supabase as any).from(table);

export async function dbQuery(table: string, options?: {
  select?: string;
  eq?: { column: string; value: any };
  order?: { column: string; ascending?: boolean };
  limit?: number;
}) {
  if (useSupabase && supabase) {
    let q = db(table).select(options?.select || '*');
    if (options?.eq) q = q.eq(options.eq.column, options.eq.value);
    if (options?.order) q = q.order(options.order.column, { ascending: options.order.ascending ?? true });
    if (options?.limit) q = q.limit(options.limit);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  }
  return localQuery(table);
}

export async function dbInsert(table: string, data: any) {
  if (useSupabase && supabase) {
    const { data: result, error } = await db(table).insert(data).select();
    if (error) throw error;
    return result;
  }
  return localInsert(table, data);
}

export async function dbUpdate(table: string, id: string, data: any) {
  if (useSupabase && supabase) {
    const { data: result, error } = await db(table).update(data).eq('id', id).select();
    if (error) throw error;
    return result;
  }
  return localUpdate(table, id, data);
}

export async function dbDelete(table: string, id: string) {
  if (useSupabase && supabase) {
    const { error } = await db(table).delete().eq('id', id);
    if (error) throw error;
    return true;
  }
  return localDelete(table, id);
}

export async function dbUploadFile(bucket: string, path: string, file: File) {
  if (useSupabase && supabase) {
    const sb: any = supabase;
    const { data, error } = await sb.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = sb.storage.from(bucket).getPublicUrl(path);
    return { path: data?.path, url: urlData?.publicUrl };
  }
  return localUploadFile(file);
}

function getLocalStore() {
  try {
    const data = localStorage.getItem('lifeos_db');
    return data ? JSON.parse(data) : {};
  } catch { return {}; }
}

function saveLocalStore(store: any) {
  try { localStorage.setItem('lifeos_db', JSON.stringify(store)); } catch {}
}

function localQuery(table: string) {
  const store = getLocalStore();
  return store[table] || [];
}

function localInsert(table: string, data: any) {
  const store = getLocalStore();
  if (!store[table]) store[table] = [];
  store[table].push(data);
  saveLocalStore(store);
  return [data];
}

function localUpdate(table: string, id: string, data: any) {
  const store = getLocalStore();
  if (store[table]) {
    store[table] = store[table].map((item: any) => item.id === id ? { ...item, ...data } : item);
    saveLocalStore(store);
  }
  return [data];
}

function localDelete(table: string, id: string) {
  const store = getLocalStore();
  if (store[table]) {
    store[table] = store[table].filter((item: any) => item.id !== id);
    saveLocalStore(store);
  }
  return true;
}

async function localUploadFile(file: File): Promise<{ path: string; url: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const path = `local/${Date.now()}_${file.name}`;
      const store = getLocalStore();
      if (!store.uploads) store.uploads = {};
      store.uploads[path] = dataUrl;
      saveLocalStore(store);
      resolve({ path, url: dataUrl });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
