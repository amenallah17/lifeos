'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder, Globe, ChevronRight, ChevronDown, Plus, Trash2, Pencil, X, FolderOpen,
  StickyNote, Send, ExternalLink, Home,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useLocalStorage } from '@/lib/usePersistence';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

interface VaultItem {
  id: string;
  name: string;
  type: 'folder' | 'website';
  url?: string;
  parent_id: string | null;
  created_at: string;
}

interface TextNote {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

function FolderRow({
  node,
  allItems,
  activeFolderId,
  depth,
  onSelect,
  onDelete,
  onRename,
  editingId,
  editValue,
  onEditChange,
  onFinishEdit,
}: {
  node: VaultItem;
  allItems: VaultItem[];
  activeFolderId: string;
  depth: number;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  editingId: string | null;
  editValue: string;
  onEditChange: (val: string) => void;
  onFinishEdit: () => void;
}) {
  const children = allItems.filter((i) => i.parent_id === node.id && i.type === 'folder');
  const isActive = activeFolderId === node.id;
  const isEditing = editingId === node.id;

  return (
    <div>
      <div
        onClick={() => { if (!isEditing) onSelect(node.id); }}
        className={`group flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-all duration-150 ${
          isActive ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/70 hover:bg-white/[0.04]'
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        <FolderOpen size={16} className="shrink-0 text-indigo-400" />
        {isEditing ? (
          <input
            autoFocus
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            onBlur={onFinishEdit}
            onKeyDown={(e) => { if (e.key === 'Enter') onFinishEdit(); if (e.key === 'Escape') onFinishEdit(); }}
            className="min-w-0 flex-1 rounded bg-white/10 px-1 py-0.5 text-sm text-white outline-none ring-1 ring-indigo-500/40"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate flex-1">{node.name}</span>
        )}
        {!isEditing && (
          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onRename(node.id, node.name); }}
              className="rounded p-0.5 text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
              className="rounded p-0.5 text-white/30 hover:text-red-400 hover:bg-white/10 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
      {children.length > 0 && (
        <div>
          {children.map((child) => (
            <FolderRow
              key={child.id}
              node={child}
              allItems={allItems}
              activeFolderId={activeFolderId}
              depth={depth + 1}
              onSelect={onSelect}
              onDelete={onDelete}
              onRename={onRename}
              editingId={editingId}
              editValue={editValue}
              onEditChange={onEditChange}
              onFinishEdit={onFinishEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FilesPage() {
  const [items, setItems] = useLocalStorage<VaultItem[]>('vault-items', [
    { id: 'root', name: 'My Vault', type: 'folder', parent_id: null, created_at: new Date().toISOString() },
  ]);
  const [activeFolderId, setActiveFolderId] = useState('root');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showAddWebsite, setShowAddWebsite] = useState(false);
  const [newWebsiteName, setNewWebsiteName] = useState('');
  const [newWebsiteUrl, setNewWebsiteUrl] = useState('');

  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useLocalStorage<TextNote[]>('vault-text-notes', []);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // ---- Breadcrumbs ----
  const breadcrumbs = useMemo(() => {
    const crumbs: VaultItem[] = [];
    let current: string | null = activeFolderId;
    while (current) {
      const item = items.find((i) => i.id === current);
      if (!item) break;
      crumbs.unshift(item);
      current = item.parent_id;
    }
    return crumbs;
  }, [items, activeFolderId]);

  const currentFolder = items.find((i) => i.id === activeFolderId);

  // ---- Folder contents ----
  const folderContents = useMemo(() => {
    return items.filter((i) => i.parent_id === activeFolderId);
  }, [items, activeFolderId]);

  // ---- Folder operations ----
  function selectFolder(id: string) {
    setActiveFolderId(id);
    setShowAddFolder(false);
    setShowAddWebsite(false);
  }

  function createFolder() {
    if (!newFolderName.trim()) return;
    const folder: VaultItem = {
      id: generateId(),
      name: newFolderName.trim(),
      type: 'folder',
      parent_id: activeFolderId,
      created_at: new Date().toISOString(),
    };
    setItems((prev) => [...prev, folder]);
    setNewFolderName('');
    setShowAddFolder(false);
  }

  function createWebsite() {
    if (!newWebsiteName.trim() || !newWebsiteUrl.trim()) return;
    let url = newWebsiteUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    const website: VaultItem = {
      id: generateId(),
      name: newWebsiteName.trim(),
      type: 'website',
      url,
      parent_id: activeFolderId,
      created_at: new Date().toISOString(),
    };
    setItems((prev) => [...prev, website]);
    setNewWebsiteName('');
    setNewWebsiteUrl('');
    setShowAddWebsite(false);
  }

  function deleteItem(id: string) {
    if (id === 'root') return;
    const idsToRemove = new Set<string>();
    function collect(fid: string) {
      idsToRemove.add(fid);
      items.filter((i) => i.parent_id === fid).forEach((i) => collect(i.id));
    }
    collect(id);
    setItems((prev) => prev.filter((i) => !idsToRemove.has(i.id)));
    if (activeFolderId === id) setActiveFolderId('root');
  }

  function renameItem(id: string, name: string) {
    setEditingId(id);
    setEditValue(name);
  }

  function finishRename() {
    if (!editingId) return;
    if (editValue.trim()) {
      setItems((prev) => prev.map((i) => i.id === editingId ? { ...i, name: editValue.trim() } : i));
    }
    setEditingId(null);
    setEditValue('');
  }

  // ---- Text Notes ----
  function saveTextNote() {
    if (!noteTitle.trim() && !noteContent.trim()) return;
    const newNote: TextNote = {
      id: generateId(),
      title: noteTitle || 'Untitled Note',
      content: noteContent,
      created_at: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setNoteTitle('');
    setNoteContent('');
  }

  function deleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="flex h-full w-full min-w-0">
      {/* ---- Left sidebar: Folder tree ---- */}
      <div className="flex h-full w-64 flex-col border-r border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <h2 className="text-sm font-semibold text-white/70 tracking-wider uppercase">Vault</h2>
          <button
            onClick={() => setNotesOpen(!notesOpen)}
            className={`rounded-lg p-1.5 transition-colors ${notesOpen ? 'bg-indigo-500/20 text-indigo-400' : 'text-white/30 hover:text-white hover:bg-white/10'}`}
            title="Text Notes"
          >
            <StickyNote size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin scrollbar-thumb-white/10 pt-3">
          <FolderRow
            node={items.find((i) => i.id === 'root')!}
            allItems={items}
            activeFolderId={activeFolderId}
            depth={0}
            onSelect={selectFolder}
            onDelete={deleteItem}
            onRename={renameItem}
            editingId={editingId}
            editValue={editValue}
            onEditChange={setEditValue}
            onFinishEdit={finishRename}
          />
        </div>
      </div>

      {/* ---- Main content ---- */}
      <div className="flex flex-1 overflow-hidden min-w-0">
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          {/* Breadcrumb + actions */}
          <div className="flex items-center gap-2 border-b border-white/5 px-6 py-3 min-w-0">
            <div className="flex items-center gap-1 text-sm text-white/40 min-w-0 overflow-hidden">
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.id} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight size={12} className="text-white/20" />}
                  <button
                    onClick={() => selectFolder(crumb.id)}
                    className={`hover:text-white transition-colors ${i === breadcrumbs.length - 1 ? 'text-white/80' : 'text-white/40'}`}
                  >
                    {crumb.name}
                  </button>
                </span>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="secondary" icon={<Plus size={13} />} onClick={() => { setShowAddFolder(true); setShowAddWebsite(false); }}>
                Add Folder
              </Button>
              <Button size="sm" variant="secondary" icon={<Globe size={13} />} onClick={() => { setShowAddWebsite(true); setShowAddFolder(false); }}>
                Add Website
              </Button>
            </div>
          </div>

          {/* Inline add forms */}
          <div className="px-6 pt-3 space-y-3">
            {showAddFolder && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2"
              >
                <input
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') createFolder(); if (e.key === 'Escape') { setShowAddFolder(false); setNewFolderName(''); } }}
                  placeholder="Folder name..."
                  className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
                />
                <Button size="sm" onClick={createFolder}>Create</Button>
                <button onClick={() => { setShowAddFolder(false); setNewFolderName(''); }} className="text-white/30 hover:text-white/70">
                  <X size={16} />
                </button>
              </motion.div>
            )}
            {showAddWebsite && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2"
              >
                <input
                  autoFocus
                  value={newWebsiteName}
                  onChange={(e) => setNewWebsiteName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') document.getElementById('ws-url')?.focus(); }}
                  placeholder="Website title..."
                  className="w-48 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
                />
                <input
                  id="ws-url"
                  value={newWebsiteUrl}
                  onChange={(e) => setNewWebsiteUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') createWebsite(); if (e.key === 'Escape') { setShowAddWebsite(false); setNewWebsiteName(''); setNewWebsiteUrl(''); } }}
                  placeholder="URL (e.g. example.com)..."
                  className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
                />
                <Button size="sm" onClick={createWebsite}>Add</Button>
                <button onClick={() => { setShowAddWebsite(false); setNewWebsiteName(''); setNewWebsiteUrl(''); }} className="text-white/30 hover:text-white/70">
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </div>

          {/* Folder contents */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {folderContents.length === 0 ? (
                <motion.div
                  key="empty"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5">
                    <Folder size={32} className="text-white/20" />
                  </div>
                  <h3 className="text-lg font-medium text-white/50">This folder is empty</h3>
                  <p className="mt-1 text-sm text-white/30">Add a folder or website to get started</p>
                </motion.div>
              ) : (
                <motion.div
                  key="grid"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                >
                  {folderContents.map((item) => (
                    item.type === 'folder' ? (
                      <motion.div key={item.id} variants={itemVariants}>
                        <GlassCard
                          hover
                          className="group p-4 cursor-pointer"
                          onClick={() => selectFolder(item.id)}
                        >
                          <div className="flex flex-col items-center text-center">
                            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15">
                              <FolderOpen size={28} className="text-indigo-400" />
                            </div>
                            <p className="text-sm font-medium text-white truncate max-w-full">{item.name}</p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                            className="absolute right-2 top-2 rounded-lg p-1.5 text-white/20 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-white/10 transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </GlassCard>
                      </motion.div>
                    ) : (
                      <motion.div key={item.id} variants={itemVariants}>
                        <GlassCard
                          hover
                          className="group p-4 cursor-pointer"
                          onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                        >
                          <div className="flex flex-col items-center text-center">
                            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/15">
                              <Globe size={28} className="text-sky-400" />
                            </div>
                            <p className="text-sm font-medium text-white truncate max-w-full">{item.name}</p>
                            <p className="mt-1 text-[11px] text-white/30 truncate max-w-full">{item.url}</p>
                          </div>
                          <div className="absolute right-2 top-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-lg p-1.5 text-white/30 hover:text-sky-400 hover:bg-white/10 transition-colors"
                            >
                              <ExternalLink size={13} />
                            </a>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                              className="rounded-lg p-1.5 text-white/20 hover:text-red-400 hover:bg-white/10 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </GlassCard>
                      </motion.div>
                    )
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ---- Right panel: Text Notes ---- */}
        {notesOpen && (
          <div className="flex max-w-96 w-80 min-w-0 flex-col border-l border-white/5 bg-white/[0.01]">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <h3 className="text-sm font-semibold text-white/70 tracking-wider uppercase">Text Notes</h3>
              <span className="text-xs text-white/30">{notes.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {notes.length === 0 ? (
                <p className="text-center text-xs text-white/30 py-8">No saved notes yet</p>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => { setNoteTitle(note.title); setNoteContent(note.content); }}
                    className="group cursor-pointer rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5 hover:bg-white/[0.06] transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-xs font-medium text-white/70 truncate flex-1">{note.title}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                        className="shrink-0 rounded p-0.5 text-white/20 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <p className="mt-1 text-[11px] text-white/30 line-clamp-3 whitespace-pre-wrap">{note.content?.slice(0, 150)}</p>
                    <p className="mt-1 text-[10px] text-white/20">{new Date(note.created_at).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-white/5 p-4 space-y-3">
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Note Title"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
              />
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Type your courses, summaries, or quick thoughts..."
                rows={10}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 resize-none font-mono leading-relaxed"
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveTextNote(); }}
              />
              <button
                onClick={saveTextNote}
                disabled={!noteTitle.trim() && !noteContent.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500/20 px-4 py-2.5 text-sm font-medium text-indigo-300 transition-colors hover:bg-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={15} />
                Save Note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
