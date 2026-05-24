'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Download, Upload, Trash2, Database, RefreshCw,
  Smartphone, Laptop, Check, X, AlertTriangle, HardDrive,
  User, Clock,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { pushToSupabase, pullFromSupabase } from '@/lib/sync';

const storageKeys = [
  'kanban-tasks', 'lifeos-projects', 'flashcard-decks', 'flashcard-cards',
  'study-notes', 'pomodoro-sessions', 'study-sessions', 'pocket-items',
  'books', 'videos', 'courses', 'course-chapters', 'course-lessons',
  'websites', 'apps', 'app-categories', 'lifeos-goals', 'lifeos-habits',
  'lifeos-habit-logs', 'vault-files', 'uni-subjects', 'uni-exams',
  'uni-assignments', 'uni-lectures', 'uni-subjects-data', 'user-name',
  'lifeos-settings', 'lifeos-theme',
];

const keyLabels: Record<string, string> = {
  'kanban-tasks': 'Tasks',
  'lifeos-projects': 'Projects',
  'flashcard-decks': 'Flashcard Decks',
  'flashcard-cards': 'Flashcards',
  'study-notes': 'Notes',
  'pomodoro-sessions': 'Pomodoro Sessions',
  'study-sessions': 'Study Sessions',
  'pocket-items': 'Pocket Items',
  books: 'Books',
  videos: 'Videos',
  courses: 'Courses',
  'course-chapters': 'Course Chapters',
  'course-lessons': 'Course Lessons',
  websites: 'Websites',
  apps: 'App Shortcuts',
  'app-categories': 'App Categories',
  'lifeos-goals': 'Goals',
  'lifeos-habits': 'Habits',
  'lifeos-habit-logs': 'Habit Logs',
  'vault-files': 'Files',
  'uni-subjects': 'Subjects',
  'uni-exams': 'Exams',
  'uni-assignments': 'Assignments',
  'uni-lectures': 'Lectures',
  'uni-subjects-data': 'Subject Resources',
  'user-name': 'User Name',
  'lifeos-settings': 'Settings',
  'lifeos-theme': 'Theme',
};

export default function AdminPage() {
  const { user, session, isOffline } = useAuth();
  const [storageStats, setStorageStats] = useState<{ key: string; count: number }[]>([]);
  const [showClearModal, setShowClearModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stats = storageKeys.map(key => {
      try {
        const raw = localStorage.getItem(key);
        const data = raw ? JSON.parse(raw) : null;
        const count = Array.isArray(data) ? data.length : (data ? 1 : 0);
        return { key, count };
      } catch {
        return { key, count: 0 };
      }
    });
    setStorageStats(stats.filter(s => s.count > 0));
  }, []);

  function handleExport() {
    const exportData: Record<string, unknown> = {};
    for (const key of storageKeys) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) exportData[key] = JSON.parse(raw);
      } catch {}
    }
    exportData['_exportedAt'] = new Date().toISOString();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        let count = 0;
        for (const key of storageKeys) {
          if (data[key]) {
            localStorage.setItem(key, JSON.stringify(data[key]));
            count++;
          }
        }
        alert(`Imported ${count} data stores successfully. Reloading page...`);
        window.location.reload();
      } catch {
        alert('Invalid backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleSyncToCloud() {
    if (!user) return;
    setSyncStatus('syncing');
    try {
      await pushToSupabase(user.id);
      setSyncStatus('done');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }

  async function handlePullFromCloud() {
    if (!user) return;
    setSyncStatus('syncing');
    try {
      await pullFromSupabase(user.id);
      setSyncStatus('done');
      setTimeout(() => setSyncStatus('idle'), 3000);
      window.location.reload();
    } catch {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }

  function handleClearAll() {
    for (const key of storageKeys) {
      localStorage.removeItem(key);
    }
    setStorageStats([]);
    setShowClearModal(false);
    alert('All local data cleared. Reloading page...');
    window.location.reload();
  }

  const totalItems = storageStats.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-4xl space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20">
            <Shield size={18} className="text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Administration</h1>
        </div>

        {/* Account Info */}
        <GlassCard className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white/70 mb-4">
            <User size={14} />
            Account
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/40">Phone</span>
              <span className="text-white/80">{user?.email || user?.phone || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">User ID</span>
              <span className="text-white/60 font-mono text-[11px]">{user?.id || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Mode</span>
              <span className="text-white/80">{user?.id?.startsWith('dev-') ? 'Offline (Local)' : 'Online (Supabase)'}</span>
            </div>
          </div>
        </GlassCard>

        {/* Sync */}
        <GlassCard className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white/70 mb-4">
            <RefreshCw size={14} />
            Cloud Sync
          </h2>
          <p className="text-xs text-white/40 mb-4">
            Sync your data with Supabase to access it from other devices (tablet, phone).
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              size="sm"
              icon={syncStatus === 'syncing' ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
              onClick={handleSyncToCloud}
              disabled={syncStatus === 'syncing' || !user || isOffline}
            >
              {syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'done' ? 'Synced!' : syncStatus === 'error' ? 'Error' : 'Push to Cloud'}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={syncStatus === 'syncing' ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
              onClick={handlePullFromCloud}
              disabled={syncStatus === 'syncing' || !user || isOffline}
            >
              Pull from Cloud
            </Button>
          </div>
        </GlassCard>

        {/* Storage Stats */}
        <GlassCard className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white/70 mb-4">
            <HardDrive size={14} />
            Storage — {totalItems} total items
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {storageStats.map(s => (
              <div key={s.key} className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2">
                <span className="text-xs text-white/50 truncate mr-2">{keyLabels[s.key] || s.key}</span>
                <span className="text-xs font-medium text-white/80 shrink-0">{s.count}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Backup / Restore */}
        <GlassCard className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white/70 mb-4">
            <Database size={14} />
            Backup & Restore
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button size="sm" icon={<Download size={14} />} onClick={handleExport}>
              Export Backup (.json)
            </Button>
            <Button size="sm" variant="secondary" icon={<Upload size={14} />} onClick={() => fileInputRef.current?.click()}>
              Import Backup
            </Button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          </div>
        </GlassCard>

        {/* Danger Zone */}
        <GlassCard className="p-5 border-red-500/20">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-red-400 mb-4">
            <AlertTriangle size={14} />
            Danger Zone
          </h2>
          <p className="text-xs text-white/40 mb-4">
            This will permanently delete all your local data. Export a backup first if needed.
          </p>
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 size={14} />}
            onClick={() => setShowClearModal(true)}
          >
            Clear All Local Data
          </Button>
        </GlassCard>
      </motion.div>

      <Modal open={showClearModal} onClose={() => setShowClearModal(false)}>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Clear All Data?</h3>
          <p className="mt-2 text-sm text-white/50">
            This action cannot be undone. All local data will be permanently deleted.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button variant="secondary" onClick={() => setShowClearModal(false)}>Cancel</Button>
            <Button variant="danger" icon={<Trash2 size={14} />} onClick={handleClearAll}>Delete Everything</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
