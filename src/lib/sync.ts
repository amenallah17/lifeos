'use client';

import { supabase } from './supabase';

interface SyncMapping {
  localStorageKey: string;
  table: string;
  idField: string;
}

const syncMappings: SyncMapping[] = [
  { localStorageKey: 'kanban-tasks', table: 'tasks', idField: 'id' },
  { localStorageKey: 'lifeos-projects', table: 'projects', idField: 'id' },
  { localStorageKey: 'flashcard-decks', table: 'decks', idField: 'id' },
  { localStorageKey: 'flashcard-cards', table: 'flashcards', idField: 'id' },
  { localStorageKey: 'study-notes', table: 'notes', idField: 'id' },
  { localStorageKey: 'pomodoro-sessions', table: 'pomodoro_sessions', idField: 'id' },
  { localStorageKey: 'study-sessions', table: 'study_sessions', idField: 'id' },
  { localStorageKey: 'pocket-items', table: 'bookmarks', idField: 'id' },
  { localStorageKey: 'books', table: 'books', idField: 'id' },
  { localStorageKey: 'videos', table: 'videos', idField: 'id' },
  { localStorageKey: 'courses', table: 'courses', idField: 'id' },
  { localStorageKey: 'course-chapters', table: 'chapters', idField: 'id' },
  { localStorageKey: 'course-lessons', table: 'lessons', idField: 'id' },
  { localStorageKey: 'websites', table: 'websites', idField: 'id' },
  { localStorageKey: 'apps', table: 'app_shortcuts', idField: 'id' },
  { localStorageKey: 'app-categories', table: 'categories', idField: 'id' },
  { localStorageKey: 'lifeos-goals', table: 'goals', idField: 'id' },
  { localStorageKey: 'lifeos-habits', table: 'habits', idField: 'id' },
  { localStorageKey: 'lifeos-habit-logs', table: 'habit_logs', idField: 'id' },
  { localStorageKey: 'vault-files', table: 'files', idField: 'id' },
  { localStorageKey: 'uni-subjects', table: 'uni_subjects', idField: 'id' },
  { localStorageKey: 'uni-exams', table: 'exams', idField: 'id' },
  { localStorageKey: 'uni-assignments', table: 'assignments', idField: 'id' },
  { localStorageKey: 'uni-lectures', table: 'lectures', idField: 'id' },
  { localStorageKey: 'uni-subjects-data', table: 'subject_resources', idField: 'id' },
  { localStorageKey: 'user-name', table: 'settings', idField: 'id' },
];

export async function pushToSupabase(userId: string) {
  for (const mapping of syncMappings) {
    try {
      const raw = localStorage.getItem(mapping.localStorageKey);
      if (!raw) continue;
      const data = JSON.parse(raw);
      if (!Array.isArray(data) || data.length === 0) continue;

      const rows = data.map((item: Record<string, unknown>) => ({
        ...item,
        user_id: userId,
      }));

      const { error } = await supabase!
        .from(mapping.table)
        .upsert(rows, { onConflict: mapping.idField });

      if (error) console.warn(`[sync] ${mapping.table}:`, error.message);
    } catch {}
  }
}

export async function pullFromSupabase(userId: string) {
  for (const mapping of syncMappings) {
    try {
      const { data, error } = await supabase!
        .from(mapping.table)
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.warn(`[sync] pull ${mapping.table}:`, error.message);
        continue;
      }

      if (data && data.length > 0) {
        const cleaned = data.map(({ user_id, ...rest }) => rest);
        localStorage.setItem(mapping.localStorageKey, JSON.stringify(cleaned));
      }
    } catch {}
  }
}

let syncInterval: ReturnType<typeof setInterval> | null = null;

export function startPeriodicSync(userId: string) {
  stopPeriodicSync();
  pushToSupabase(userId);
  syncInterval = setInterval(() => pushToSupabase(userId), 30000);
}

export function stopPeriodicSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}
