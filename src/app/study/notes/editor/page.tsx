'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { default as ReactMarkdown } from 'react-markdown';
import {
  ArrowLeft, Save, Pin, Trash2, Eye, Edit2, Tag, BookOpen,
  FileText, Star, Clock, AlertTriangle, Mail,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useLocalStorage } from '@/lib/usePersistence';
import { UniNote } from '@/types';

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

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const noteId = searchParams.get('noteId');

  const [notes, setNotes] = useLocalStorage<UniNote[]>('study-notes', []);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('General');
  const [tagsInput, setTagsInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [preview, setPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNewNote = !noteId || noteId === 'new';

  useEffect(() => {
    if (isNewNote) {
      setCurrentNoteId(generateId());
      setTitle('');
      setContent('');
      setSubject('General');
      setTagsInput('');
      setIsPinned(false);
      setSaveStatus('saved');
      setInitialized(true);
      return;
    }
    const existing = notes.find(n => n.id === noteId);
    if (existing) {
      setCurrentNoteId(existing.id);
      setTitle(existing.title);
      setContent(existing.content);
      setSubject(existing.subject_id ?? 'General');
      setTagsInput(existing.tags ?? '');
      setIsPinned(existing.pinned);
      setSaveStatus('saved');
      setInitialized(true);
    }
  }, [noteId]);

  const saveNote = useCallback(() => {
    if (!currentNoteId) return;
    const now = new Date().toISOString();
    setNotes(prev => {
      const existing = prev.find(n => n.id === currentNoteId);
      if (existing) {
        return prev.map(n => n.id === currentNoteId
          ? { ...n, title: title || 'Untitled', content, subject_id: subject, tags: tagsInput || undefined, pinned: isPinned, updated_at: now }
          : n
        );
      }
      return [{
        id: currentNoteId,
        title: title || 'Untitled',
        content,
        subject_id: subject,
        tags: tagsInput || undefined,
        pinned: isPinned,
        type: 'markdown',
        created_at: now,
        updated_at: now,
      }, ...prev];
    });
    setSaveStatus('saved');
  }, [currentNoteId, title, content, subject, tagsInput, isPinned, setNotes]);

  useEffect(() => {
    if (!initialized) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (isNewNote && !title && !content) return;
    setSaveStatus('unsaved');
    saveTimer.current = setTimeout(() => {
      setSaveStatus('saving');
      saveTimer.current = setTimeout(() => {
        saveNote();
      }, 400);
    }, 2000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [title, content, subject, tagsInput, isPinned, initialized, isNewNote, saveNote]);

  const handleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveNote();
  }, [saveNote]);

  const handleDelete = useCallback(() => {
    if (!currentNoteId) return;
    setNotes(prev => prev.filter(n => n.id !== currentNoteId));
    setShowDeleteModal(false);
    router.push('/study/notes');
  }, [currentNoteId, router, setNotes]);

  const goBack = useCallback(() => {
    router.push('/study/notes');
  }, [router]);

  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-5"
        >

          {/* ─── Top Bar ─── */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={goBack}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h1 className="text-lg font-bold text-white">
                  {isNewNote ? 'New Note' : 'Edit Note'}
                </h1>
                <p className="text-xs text-white/40">
                  {isNewNote ? 'Create a new note' : `Editing ${title || 'untitled'}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs">
                {saveStatus === 'saving' && (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <span className="text-amber-400/70">Saving...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <Save size={13} className="text-emerald-400" />
                    <span className="text-emerald-400/70">Saved</span>
                  </>
                )}
                {saveStatus === 'unsaved' && (
                  <>
                    <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-amber-400/50">Unsaved</span>
                  </>
                )}
              </div>
              <button
                onClick={() => setPreview(!preview)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  preview ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-white/40 hover:text-white/70'
                }`}
              >
                {preview ? <Edit2 size={14} /> : <Eye size={14} />}
              </button>
              <Button size="sm" icon={<Save size={14} />} onClick={handleSave}>Save</Button>
              <button
                onClick={() => {
                  const subjectE = encodeURIComponent(title || 'Note from LifeOS');
                  const bodyE = encodeURIComponent(
                    title + '\n' + '='.repeat(title.length) + '\n\n' +
                    content + '\n\n---\nSent from LifeOS'
                  );
                  window.location.href = `mailto:?subject=${subjectE}&body=${bodyE}`;
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/40 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                title="Send to Email"
              >
                <Mail size={14} />
              </button>
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 size={14} />}
                onClick={() => setShowDeleteModal(true)}
                disabled={isNewNote}
              >
                Delete
              </Button>
            </div>
          </div>

          {/* ─── Title ─── */}
          <GlassCard className="p-4">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Note title..."
              className="w-full bg-transparent text-xl font-bold text-white outline-none placeholder-white/20"
            />
          </GlassCard>

          {/* ─── Meta Row ─── */}
          <GlassCard className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-white/40" />
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="appearance-none rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 pr-7 text-xs text-white/70 outline-none backdrop-blur-xl focus:border-indigo-500/50 cursor-pointer"
                >
                  {allSubjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-white/40" />
                <input
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  placeholder="react, hooks, frontend"
                  className="w-48 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 outline-none backdrop-blur-xl placeholder-white/20 focus:border-indigo-500/50"
                />
              </div>
              <button
                onClick={() => setIsPinned(!isPinned)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isPinned
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                    : 'border-white/10 bg-white/5 text-white/40 hover:text-white/70'
                }`}
              >
                <Star size={12} className={isPinned ? 'fill-amber-400' : ''} />
                {isPinned ? 'Pinned' : 'Pin'}
              </button>
            </div>
          </GlassCard>

          {/* ─── Tags display ─── */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map(tag => {
                const hue = tag.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
                return (
                  <Badge
                    key={tag}
                    variant="default"
                    className="text-[11px] px-2 py-0.5"
                    style={{ borderColor: `hsl(${hue}, 50%, 50%, 0.3)`, background: `hsl(${hue}, 50%, 50%, 0.1)`, color: `hsl(${hue}, 50%, 70%)` }}
                  >
                    {tag}
                  </Badge>
                );
              })}
            </div>
          )}

          {/* ─── Editor / Preview ─── */}
          <motion.div layout className="relative">
            {preview ? (
              <GlassCard className="p-5 min-h-[400px]">
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="text-xl font-bold text-white mb-3 mt-5 first:mt-0">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg font-semibold text-white/90 mb-2 mt-4">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-base font-semibold text-white/80 mb-2 mt-3">{children}</h3>,
                      p: ({ children }) => <p className="text-sm text-white/70 leading-relaxed mb-3">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-white/90">{children}</strong>,
                      ul: ({ children }) => <ul className="list-disc pl-5 mb-3 text-sm text-white/70 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 text-sm text-white/70 space-y-1">{children}</ol>,
                      li: ({ children }) => <li>{children}</li>,
                      code: ({ children }) => (
                        <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs font-mono text-cyan-300">{children}</code>
                      ),
                      pre: ({ children }) => (
                        <pre className="mb-4 overflow-x-auto rounded-xl bg-white/[0.03] border border-white/5 p-4 text-sm font-mono text-cyan-300">{children}</pre>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-indigo-400/30 pl-4 italic text-white/50 mb-3">{children}</blockquote>
                      ),
                      table: ({ children }) => (
                        <div className="mb-4 overflow-x-auto">
                          <table className="w-full text-sm text-white/70 border-collapse">{children}</table>
                        </div>
                      ),
                      th: ({ children }) => <th className="border border-white/10 bg-white/[0.03] px-3 py-2 text-left font-medium text-white/80">{children}</th>,
                      td: ({ children }) => <td className="border border-white/10 px-3 py-2">{children}</td>,
                      a: ({ children, href }) => <a href={href} className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">{children}</a>,
                      img: ({ src, alt }) => <img src={src} alt={alt} className="rounded-xl max-w-full my-3" />,
                      hr: () => <hr className="my-4 border-white/5" />,
                    }}
                  >
                    {content || '*Start writing to see the preview...*'}
                  </ReactMarkdown>
                </div>
              </GlassCard>
            ) : (
              <GlassCard className="p-0 overflow-hidden">
                <div className="flex items-center gap-2 border-b border-white/5 bg-white/[0.02] px-4 py-2.5">
                  <FileText size={13} className="text-white/30" />
                  <span className="text-[11px] font-medium text-white/30">Markdown</span>
                </div>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Write your note in markdown..."
                  className="min-h-[400px] w-full resize-y bg-transparent p-5 font-mono text-sm text-white/80 outline-none placeholder-white/15 leading-relaxed"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
              </GlassCard>
            )}
          </motion.div>

          {/* ─── Footer Meta ─── */}
          {isPinned && !isNewNote && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400/60">
              <Pin size={12} />
              <span>Pinned note</span>
            </div>
          )}
          {!isNewNote && (
            <div className="flex items-center gap-1.5 text-xs text-white/30">
              <Clock size={12} />
              <span>Last edited: {new Date().toLocaleString()}</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* ─── Delete Confirmation Modal ─── */}
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Delete Note</h3>
          <p className="mt-2 text-sm text-white/50">
            Are you sure you want to delete "{title || 'Untitled'}"? This action cannot be undone.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" icon={<Trash2 size={14} />} onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <svg className="h-5 w-5 animate-spin text-indigo-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-sm text-white/50">Loading editor...</span>
        </div>
      </main>
    }>
      <EditorContent />
    </Suspense>
  );
}
