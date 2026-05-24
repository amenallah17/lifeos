'use client';

declare global {
  interface Window {
    electronAPI?: {
      storageData: Record<string, string> | null;
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      dbQuery: (sql: string, params?: any[]) => Promise<string>;
      dbGet: (sql: string, params?: any[]) => Promise<string>;
      storageLoad: () => Promise<Record<string, string> | null>;
      storageSave: (data: Record<string, string>) => Promise<void>;
      onToggleCommandPalette: (callback: () => void) => () => void;
      onToggleQuickCapture: (callback: () => void) => () => void;
    };
  }
}

const isElectron = typeof window !== 'undefined' && window.electronAPI;

export async function query(sql: string, params: any[] = []): Promise<any> {
  if (isElectron) {
    const result = await window.electronAPI!.dbQuery(sql, params);
    return JSON.parse(result);
  }
  return localQuery(sql, params);
}

export async function get(sql: string, params: any[] = []): Promise<any> {
  if (isElectron) {
    const result = await window.electronAPI!.dbGet(sql, params);
    return JSON.parse(result);
  }
  const rows = await localQuery(sql, params);
  return rows[0] || null;
}

async function localQuery(sql: string, params: any[] = []): Promise<any> {
  const store = getLocalStore();
  const action = sql.trim().toUpperCase();

  if (action.startsWith('SELECT') || action.startsWith('WITH')) {
    const tableMatch = sql.match(/FROM\s+(\w+)/i);
    if (!tableMatch) return [];
    const table = tableMatch[1];
    const data = store[table] || [];
    return applyFilters(data, sql, params);
  }

  if (action.startsWith('INSERT')) {
    const tableMatch = sql.match(/INTO\s+(\w+)/i);
    if (!tableMatch) return { changes: 0 };
    const table = tableMatch[1];
    const colMatch = sql.match(/\(([^)]+)\)/);
    const valMatch = sql.match(/VALUES\s*\(([^)]+)\)/i);
    if (!colMatch || !valMatch) return { changes: 0 };
    const cols = colMatch[1].split(',').map(c => c.trim());
    const vals = valMatch[1].split(',').map((v: string) => v.trim());
    const obj: any = {};
    let paramIdx = 0;
    cols.forEach((c: string, i: number) => {
      let val: any = vals[i];
      if (val === '?') {
        val = params[paramIdx++];
      } else if (val.startsWith("'") && val.endsWith("'")) {
        val = val.slice(1, -1);
      }
      obj[c] = val;
    });
    if (!store[table]) store[table] = [];
    store[table].push(obj);
    saveLocalStore(store);
    return { changes: 1, lastInsertRowid: store[table].length };
  }

  if (action.startsWith('UPDATE')) {
    const tableMatch = sql.match(/UPDATE\s+(\w+)/i);
    if (!tableMatch) return { changes: 0 };
    saveLocalStore(store);
    return { changes: 1 };
  }

  if (action.startsWith('DELETE')) {
    const tableMatch = sql.match(/FROM\s+(\w+)/i);
    if (!tableMatch) return { changes: 0 };
    saveLocalStore(store);
    return { changes: 1 };
  }

  return [];
}

function applyFilters(data: any[], sql: string, params: any[]): any[] {
  let result = [...data];

  const whereMatch = sql.match(/WHERE\s+(.+?)(?:ORDER BY|LIMIT|OFFSET|$)/i);
  if (whereMatch) {
    const conditions = whereMatch[1];
    if (conditions.includes('id = ?')) {
      const idx = conditions.split(/\s+/).indexOf('?');
      if (idx >= 0) {
        const val = params[0];
        result = result.filter((r: any) => r.id === val);
      }
    }
  }

  const orderMatch = sql.match(/ORDER BY\s+(\w+)(\s+(ASC|DESC))?/i);
  if (orderMatch) {
    const col = orderMatch[1];
    const dir = (orderMatch[3] || 'ASC').toUpperCase();
    result.sort((a: any, b: any) => {
      if (dir === 'DESC') return b[col] > a[col] ? 1 : -1;
      return a[col] > b[col] ? 1 : -1;
    });
  }

  const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
  if (limitMatch) {
    result = result.slice(0, parseInt(limitMatch[1]));
  }

  return result;
}

function getLocalStore(): any {
  try {
    const data = localStorage.getItem('lifeos_db');
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveLocalStore(store: any): void {
  try {
    localStorage.setItem('lifeos_db', JSON.stringify(store));
  } catch {}
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function getCurrentDate(): string {
  return new Date().toISOString();
}
