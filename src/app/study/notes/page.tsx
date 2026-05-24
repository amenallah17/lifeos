'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Plus, Grid3X3, List, FileText, Pin, Star,
  Tag, BookOpen, Clock, ChevronRight, ArrowUp, Trash2, Mail,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { useLocalStorage } from '@/lib/usePersistence';
import { UniNote } from '@/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const subjectColors: Record<string, string> = {
  Networks: '#6366f1',
  'Operating Systems': '#10b981',
  Algorithms: '#f59e0b',
  Mathematics: '#ef4444',
  Databases: '#06b6d4',
  Programming: '#8b5cf6',
  'Web Development': '#ec4899',
  General: '#78716c',
};

const allSubjects = Object.keys(subjectColors);

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/>\s/g, '')
    .replace(/[-*+]\s/g, '')
    .replace(/\n{2,}/g, ' ')
    .trim();
}

function parseTags(tags?: string): string[] {
  if (!tags) return [];
  return tags.split(',').map(t => t.trim()).filter(Boolean);
}

export default function NotesPage() {
  const [notes, setNotes] = useLocalStorage<UniNote[]>('study-notes', []);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [tagFilter, setTagFilter] = useState('');

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach(n => parseTags(n.tags).forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [notes]);

  const filteredNotes = useMemo(() => {
    let result = [...notes];
    if (subjectFilter !== 'All') {
      result = result.filter(n => (n.subject_id ?? 'General') === subjectFilter);
    }
    if (tagFilter) {
      result = result.filter(n => parseTags(n.tags).includes(tagFilter));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || parseTags(n.tags).some(t => t.includes(q))
      );
    }
    result.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    return result;
  }, [notes, subjectFilter, tagFilter, searchQuery]);

  const pinnedNotes = useMemo(() => filteredNotes.filter(n => n.pinned), [filteredNotes]);
  const unpinnedNotes = useMemo(() => filteredNotes.filter(n => !n.pinned), [filteredNotes]);

  function handleNewNote() {
    window.location.href = '/study/notes/editor';
  }

  function openNote(id: string) {
    window.location.href = '/study/notes/editor?noteId=' + id;
  }

  function sendNoteByEmail(note: UniNote) {
    const subject = encodeURIComponent(note.title || 'Note from LifeOS');
    const body = encodeURIComponent(
      note.title + '\n' + '='.repeat(note.title.length) + '\n\n' +
      note.content + '\n\n---\nSent from LifeOS'
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  const handleDeleteNote = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotes(prev => prev.filter(n => n.id !== id));
  }, [setNotes]);

  function renderNoteCard(note: UniNote) {
    const subjectColor = subjectColors[note.subject_id ?? 'General'] || '#78716c';
    const preview = stripMarkdown(note.content).substring(0, 100);
    const truncated = stripMarkdown(note.content).length > 100;
    const tags = parseTags(note.tags);

    if (view === 'list') {
      return (
        <GlassCard key={note.id} className="p-3" hover onClick={() => openNote(note.id)}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-1 shrink-0 rounded-full" style={{ background: subjectColor }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {note.pinned && <Star size={12} className="shrink-0 fill-amber-400 text-amber-400" />}
                <span className="text-sm font-medium text-white truncate">{note.title}</span>
              </div>
              <p className="mt-0.5 text-xs text-white/40 truncate">{preview}</p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              {tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="default">{tag}</Badge>
              ))}
              {tags.length > 2 && (
                <span className="text-[10px] text-white/30">+{tags.length - 2}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/30 shrink-0">
              <Clock size={12} />
              {timeAgo(note.updated_at)}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); sendNoteByEmail(note); }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/20 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors shrink-0"
              title="Send to Email"
            >
              <Mail size={13} />
            </button>
            <button
              onClick={(e) => handleDeleteNote(e, note.id)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
            >
              <Trash2 size={13} />
            </button>
            <ChevronRight size={14} className="shrink-0 text-white/20" />
          </div>
        </GlassCard>
      );
    }

    return (
      <GlassCard key={note.id} className="p-4" hover onClick={() => openNote(note.id)}>
        <div className="flex items-start justify-between">
          <div className="flex h-7 w-1 shrink-0 rounded-full" style={{ background: subjectColor }} />
          <div className="ml-3 flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {note.pinned && <Star size={12} className="shrink-0 fill-amber-400 text-amber-400" />}
              <h3 className="text-sm font-semibold text-white truncate">{note.title}</h3>
            </div>
            <p className="mt-1.5 text-xs text-white/40 leading-relaxed">
              {preview}{truncated ? '...' : ''}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Clock size={11} className="text-white/30" />
                <span className="text-[10px] text-white/30">{timeAgo(note.updated_at)}</span>
              </div>
            </div>
            {tags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {tags.map(tag => (
                  <Badge key={tag} variant="default" className="text-[10px] px-1.5 py-0.5">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); sendNoteByEmail(note); }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/20 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
              title="Send to Email"
            >
              <Mail size={13} />
            </button>
            <button
              onClick={(e) => handleDeleteNote(e, note.id)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl p-6">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">

          {/* ─── Header ─── */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/30">
                <FileText size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Notes</h1>
                <p className="text-xs text-white/40">{notes.length} notes</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-48">
                <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  icon={<Search size={15} />}
                />
              </div>
              <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-1">
                <button
                  onClick={() => setView('grid')}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    view === 'grid' ? 'bg-indigo-500/20 text-indigo-300' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <Grid3X3 size={15} />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    view === 'list' ? 'bg-indigo-500/20 text-indigo-300' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <List size={15} />
                </button>
              </div>
              <Button icon={<Plus size={16} />} onClick={handleNewNote}>New Note</Button>
            </div>
          </motion.div>

          {/* ─── Filters ─── */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <BookOpen size={14} className="text-white/40" />
              <select
                value={subjectFilter}
                onChange={e => setSubjectFilter(e.target.value)}
                className="appearance-none rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 pr-7 text-xs text-white/70 outline-none backdrop-blur-xl focus:border-indigo-500/50 cursor-pointer"
              >
                <option value="All">All Subjects</option>
                {allSubjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {allTags.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Tag size={14} className="text-white/40" />
                <select
                  value={tagFilter}
                  onChange={e => setTagFilter(e.target.value)}
                  className="appearance-none rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 pr-7 text-xs text-white/70 outline-none backdrop-blur-xl focus:border-indigo-500/50 cursor-pointer"
                >
                  <option value="">All Tags</option>
                  {allTags.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}
            {(subjectFilter !== 'All' || tagFilter || searchQuery) && (
              <button
                onClick={() => { setSubjectFilter('All'); setTagFilter(''); setSearchQuery(''); }}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Clear filters
              </button>
            )}
          </motion.div>

          {/* ─── Notes Content ─── */}
          {filteredNotes.length === 0 ? (
            <motion.div variants={itemVariants} className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-24">
              <FileText size={48} className="text-white/15" />
              <p className="mt-4 text-lg font-medium text-white/30">No notes yet</p>
              <p className="mt-1 text-sm text-white/20">Create your first note to get started</p>
              <Button icon={<Plus size={16} />} className="mt-6" onClick={handleNewNote}>New Note</Button>
            </motion.div>
          ) : (
            <>
              {pinnedNotes.length > 0 && (
                <motion.div variants={itemVariants} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Pin size={14} className="text-amber-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-400/70">Pinned</span>
                  </div>
                  {view === 'grid' ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {pinnedNotes.map(note => renderNoteCard(note))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pinnedNotes.map(note => renderNoteCard(note))}
                    </div>
                  )}
                </motion.div>
              )}

              <motion.div variants={itemVariants} className="space-y-3">
                {pinnedNotes.length > 0 && (
                  <div className="flex items-center gap-2">
                    <ArrowUp size={14} className="text-white/30" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/30">All Notes</span>
                  </div>
                )}
                {view === 'grid' ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {unpinnedNotes.map(note => renderNoteCard(note))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {unpinnedNotes.map(note => renderNoteCard(note))}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </main>
  );
}
