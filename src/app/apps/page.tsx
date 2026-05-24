'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Monitor, Star, Trash2, Pencil, Plus, Search, Grid3X3,
  List, MoreVertical, ExternalLink, X, Check, Clock, Sparkles,
  AppWindow, FolderOpen, Hash, Link, Cat, FolderPlus, ChevronRight, Folder,
  ArrowLeft, ArrowRight, RotateCw, GripVertical,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Divider from '@/components/ui/Divider';
import AppCard from '@/components/ui/AppCard';
import { useLocalStorage } from '@/lib/usePersistence';
import type { AppShortcut, AppFolder } from '@/types';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

const gradientColors = [
  { name: 'Sunset', value: 'from-orange-500 to-pink-600' },
  { name: 'Ocean', value: 'from-cyan-500 to-blue-600' },
  { name: 'Forest', value: 'from-emerald-500 to-teal-600' },
  { name: 'Lavender', value: 'from-purple-500 to-indigo-600' },
  { name: 'Rose', value: 'from-pink-500 to-rose-600' },
  { name: 'Sky', value: 'from-sky-500 to-indigo-600' },
  { name: 'Amber', value: 'from-amber-500 to-orange-600' },
  { name: 'Neon', value: 'from-green-400 to-emerald-600' },
  { name: 'Berry', value: 'from-violet-500 to-fuchsia-600' },
  { name: 'Coral', value: 'from-red-400 to-rose-600' },
  { name: 'Slate', value: 'from-slate-400 to-slate-600' },
  { name: 'Mint', value: 'from-teal-300 to-cyan-600' },
];

const defaultCategories = ['Study', 'Coding', 'AI Tools', 'Productivity'];

interface FormData {
  name: string;
  url: string;
  path: string;
  type: 'app' | 'website';
  category: string;
  color: string;
  favorite: boolean;
}

const defaultForm: FormData = {
  name: '', url: '', path: '', type: 'website', category: 'Coding', color: 'from-sky-500 to-blue-600', favorite: false,
};

function getCategoryColor(catName: string): string {
  const idx = catName.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return gradientColors[idx % gradientColors.length].value;
}

function DraggableAppCard({
  app, index, onOpen, onToggleFavorite, onEdit, onDelete, onContextMenu, isMenuOpen,
}: {
  app: AppShortcut; index: number; onOpen: (a: AppShortcut) => void; onToggleFavorite: (id: string) => void;
  onEdit: (a: AppShortcut) => void; onDelete: (id: string) => void;
  onContextMenu: (id: string | null) => void; isMenuOpen: boolean;
}) {
  return (
    <Draggable draggableId={app.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.85 : 1,
            zIndex: snapshot.isDragging ? 50 : undefined,
          }}
          className="relative"
        >
          <div className="absolute top-2 left-2 z-10">
            <GripVertical size={14} className="text-zinc-950/30 hover:text-zinc-950 cursor-grab active:cursor-grabbing transition-colors" />
          </div>
          <AppCard
            name={app.name}
            url={app.type === 'app' ? undefined : app.url}
            category={app.category}
            type={app.type}
            color={app.color}
            onOpen={() => onOpen(app)}
            onEdit={() => { onEdit(app); onContextMenu(null); }}
            onChangeCategory={() => { onContextMenu(null); }}
            onDeleteApp={() => { onDelete(app.id); onContextMenu(null); }}
          />
        </div>
      )}
    </Draggable>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.03, delayChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export default function AppsPage() {
  const [apps, setApps] = useLocalStorage<AppShortcut[]>('apps', []);
  const [categories, setCategories] = useLocalStorage<string[]>('app-categories', defaultCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<AppShortcut | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [recentApps, setRecentApps] = useState<AppShortcut[]>([]);
  const [showLaunchpad, setShowLaunchpad] = useState(false);
  const [folders, setFolders] = useLocalStorage<AppFolder[]>('app-folders', []);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editFolderModalOpen, setEditFolderModalOpen] = useState(false);
  const [editFolderId, setEditFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderCategory, setEditFolderCategory] = useState('');
  const navRef = useRef({ history: [] as { category: string | null; folder: string | null }[], pointer: -1 });
  const [, forceUpdate] = useState(0);

  const pushNav = useCallback((category: string | null, folder: string | null) => {
    const n = navRef.current;
    n.history = [...n.history.slice(0, n.pointer + 1), { category, folder }];
    n.pointer++;
    forceUpdate((x) => x + 1);
  }, []);

  const handleNavBack = useCallback(() => {
    const n = navRef.current;
    if (n.pointer <= 0) return;
    const newPtr = n.pointer - 1;
    const entry = n.history[newPtr];
    if (!entry) return;
    n.pointer = newPtr;
    setSelectedCategory(entry.category);
    setActiveFolderId(entry.folder);
    forceUpdate((x) => x + 1);
  }, []);

  const handleNavForward = useCallback(() => {
    const n = navRef.current;
    if (n.pointer >= n.history.length - 1) return;
    const newPtr = n.pointer + 1;
    const entry = n.history[newPtr];
    if (!entry) return;
    n.pointer = newPtr;
    setSelectedCategory(entry.category);
    setActiveFolderId(entry.folder);
    forceUpdate((x) => x + 1);
  }, []);

  const handleRefresh = useCallback(() => {
    forceUpdate((n) => n + 1);
  }, []);

  const navTo = useCallback((category: string | null, folder: string | null) => {
    pushNav(selectedCategory, activeFolderId);
    setSelectedCategory(category);
    setActiveFolderId(folder);
  }, [selectedCategory, activeFolderId, pushNav]);

  const isFiltered = searchQuery !== '' || selectedCategory !== null || activeFolderId !== null;

  const categoryFolders = useMemo(() => {
    if (!selectedCategory) return [];
    return folders.filter((f) => f.categoryId === selectedCategory);
  }, [folders, selectedCategory]);

  const currentFolder = useMemo(() => {
    if (!activeFolderId) return null;
    return folders.find((f) => f.id === activeFolderId) ?? null;
  }, [folders, activeFolderId]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    apps.forEach((a) => { counts[a.category || ''] = (counts[a.category || ''] || 0) + 1; });
    return counts;
  }, [apps]);

  const filteredApps = useMemo(() => {
    let result = [...apps];
    if (activeFolderId) {
      result = result.filter((a) => a.folderId === activeFolderId);
    } else if (selectedCategory) {
      result = result.filter((a) => a.category === selectedCategory && !a.folderId);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) => a.name.toLowerCase().includes(q) || (a.url || '').toLowerCase().includes(q) || (a.path || '').toLowerCase().includes(q));
    }
    return result;
  }, [apps, selectedCategory, activeFolderId, searchQuery]);

  const favorites = useMemo(() => apps.filter((a) => a.favorite && !a.folderId), [apps]);

  const categoryOptions = useMemo(() => categories, [categories]);

  function handleOpen(app: AppShortcut) {
    if (app.type === 'website' && app.url) {
      window.open(app.url, '_blank', 'noopener,noreferrer');
    } else if (app.type === 'app' && app.path) {
      try { window.open(app.path); } catch { window.open('', '_blank'); }
    }
    setRecentApps((prev) => {
      const filtered = prev.filter((a) => a.id !== app.id);
      return [app, ...filtered].slice(0, 5);
    });
  }

  function toggleFavorite(id: string) {
    setApps((prev) => prev.map((a) => a.id === id ? { ...a, favorite: !a.favorite } : a));
  }

  function openAddModal() {
    setEditingApp(null);
    setFormData({ ...defaultForm, category: categoryOptions[0] || 'Coding' });
    setModalOpen(true);
  }

  function openEditModal(app: AppShortcut) {
    setEditingApp(app);
    setFormData({
      name: app.name,
      url: app.url || '',
      path: app.path || '',
      type: app.type,
      category: app.category || '',
      color: app.color || getCategoryColor(app.category || ''),
      favorite: app.favorite,
    });
    setModalOpen(true);
  }

  function handleSave() {
    if (!formData.name.trim()) return;
    if (formData.type === 'website' && !formData.url.trim()) return;
    if (formData.type === 'app' && !formData.path.trim()) return;

    if (editingApp) {
      setApps((prev) => prev.map((a) => a.id === editingApp.id ? {
        ...a,
        name: formData.name.trim(),
        url: formData.type === 'website' ? (formData.url.startsWith('http') ? formData.url : `https://${formData.url}`) : undefined,
        path: formData.type === 'app' ? formData.path : undefined,
        type: formData.type,
        category: formData.category,
        color: formData.color,
        favorite: formData.favorite,
        folderId: activeFolderId ?? a.folderId,
      } : a));
    } else {
      const newApp: AppShortcut = {
        id: generateId(),
        name: formData.name.trim(),
        url: formData.type === 'website' ? (formData.url.startsWith('http') ? formData.url : `https://${formData.url}`) : undefined,
        path: formData.type === 'app' ? formData.path : undefined,
        type: formData.type,
        category: formData.category,
        color: formData.color,
        favorite: formData.favorite,
        folderId: activeFolderId ?? undefined,
        created_at: new Date().toISOString(),
      };
      setApps((prev) => [newApp, ...prev]);
    }

    setModalOpen(false);
    setEditingApp(null);
    setFormData(defaultForm);
  }

  function handleDelete(id: string) {
    setApps((prev) => {
      const app = prev.find((a) => a.id === id);
      if (app?.folderId) {
        setFolders((prevFolders) =>
          prevFolders.map((f) =>
            f.id === app.folderId
              ? { ...f }
              : f
          )
        );
      }
      return prev.filter((a) => a.id !== id);
    });
    setRecentApps((prev) => prev.filter((a) => a.id !== id));
    setMenuOpenId(null);
  }

  function handleDragEnd(result: DropResult) {
    const { draggableId, destination } = result;
    if (!destination) return;

    const destId = destination.droppableId;

    // Dropped onto a folder card
    if (destId !== 'app-grid') {
      const folder = folders.find((f) => f.id === destId);
      if (folder) {
        setApps((prev) =>
          prev.map((a) =>
            a.id === draggableId ? { ...a, folderId: destId, category: folder.categoryId } : a
          )
        );
      }
      return;
    }

    // Dropped within the grid — reorder (indexes from filtered view)
    const sourceApp = filteredApps.find((a) => a.id === draggableId);
    const destApp = filteredApps[destination.index];
    if (!sourceApp || !destApp || sourceApp.id === destApp.id) return;

    const fullSourceIdx = apps.findIndex((a) => a.id === sourceApp.id);
    const fullDestIdx = apps.findIndex((a) => a.id === destApp.id);
    if (fullSourceIdx === -1 || fullDestIdx === -1) return;

    setApps((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(fullSourceIdx, 1);
      const adjustedDest = fullSourceIdx < fullDestIdx ? fullDestIdx - 1 : fullDestIdx;
      arr.splice(adjustedDest, 0, moved);
      return arr;
    });
  }

  function addCategory() {
    if (!newCategoryName.trim()) return;
    const name = newCategoryName.trim();
    if (categories.some((c) => c.toLowerCase() === name.toLowerCase())) return;
    setCategories((prev) => [...prev, name]);
    setNewCategoryName('');
  }

  function handleDeleteFolder(folderId: string) {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setApps((prev) =>
      prev.map((a) => (a.folderId === folderId ? { ...a, folderId: undefined } : a))
    );
    if (activeFolderId === folderId) setActiveFolderId(null);
  }

  function handleUpdateFolder(folderId: string, newName: string, newCategory: string) {
    if (!newName.trim() || !folderId) return;
    setFolders((prev) =>
      prev.map((f) => {
        if (f.id !== folderId) return f;
        const updated = { ...f, name: newName.trim() };
        if (newCategory && newCategory !== f.categoryId) {
          updated.categoryId = newCategory;
          setApps((prevApps) =>
            prevApps.map((a) =>
              a.folderId === folderId ? { ...a, category: newCategory } : a
            )
          );
        }
        return updated;
      })
    );
    setEditFolderModalOpen(false);
    setEditFolderId(null);
    setEditFolderName('');
    setEditFolderCategory('');
  }

  function handleCreateFolder() {
    if (!newFolderName.trim() || !selectedCategory) return;
    const folder: AppFolder = {
      id: generateId(),
      name: newFolderName.trim(),
      categoryId: selectedCategory,
    };
    setFolders((prev) => [...prev, folder]);
    setNewFolderName('');
    setFolderModalOpen(false);
  }

  function deleteCategory(name: string) {
    setCategories((prev) => prev.filter((c) => c !== name));
    setApps((prev) => prev.filter((a) => a.category !== name));
    setFolders((prev) => prev.filter((f) => f.categoryId !== name));
    setRecentApps((prev) => prev.filter((a) => a.category !== name));
    if (selectedCategory === name) { navTo(null, null); }
  }

  function handleRenameCategory(oldName: string, newName: string) {
    if (!newName.trim() || newName === oldName) return;
    if (categories.some((c) => c.toLowerCase() === newName.trim().toLowerCase() && c !== oldName)) return;
    setCategories((prev) => prev.map((c) => (c === oldName ? newName.trim() : c)));
    setApps((prev) => prev.map((a) => (a.category === oldName ? { ...a, category: newName.trim() } : a)));
    setFolders((prev) => prev.map((f) => (f.categoryId === oldName ? { ...f, categoryId: newName.trim() } : f)));
    if (selectedCategory === oldName) setSelectedCategory(newName.trim());
    setEditingCategoryId(null);
    setEditingCategoryValue('');
  }

  const launchpadApps = useMemo(() => {
    const sorted = [...apps].sort((a, b) => a.favorite === b.favorite ? 0 : a.favorite ? -1 : 1);
    return sorted;
  }, [apps]);

  return (
    <div className="min-h-screen p-6 bg-emerald-500">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl space-y-6"
      >
        <motion.div variants={itemVariants} className="flex items-center gap-1 mb-2">
          <button
            onClick={handleNavBack}
            disabled={navRef.current.pointer <= 0}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
            title="Back"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            onClick={handleNavForward}
            disabled={navRef.current.pointer >= navRef.current.history.length - 1}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
            title="Forward"
          >
            <ArrowRight size={16} />
          </button>
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Refresh"
          >
            <RotateCw size={16} />
          </button>
        </motion.div>
        <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/20 shadow-lg">
              <AppWindow size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-black">Apps & Websites</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<Grid3X3 size={14} />} onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
              {viewMode === 'grid' ? 'List' : 'Grid'}
            </Button>
            <Button variant="secondary" size="sm" icon={<Sparkles size={14} />} onClick={() => setShowLaunchpad(!showLaunchpad)}>
              Launchpad
            </Button>
            <Button variant="secondary" size="sm" icon={<Cat size={14} />} onClick={() => setCategoryModalOpen(true)}>
              Categories
            </Button>
            <Button size="sm" icon={<Plus size={14} />} onClick={openAddModal}>
              New App
            </Button>
          </div>
        </motion.div>

        <AnimatePresence>
          {showLaunchpad && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <GlassCard className="p-6" glow>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-white/60" />
                    <h2 className="text-sm font-semibold text-white/80">Quick Launch</h2>
                  </div>
                  <button onClick={() => setShowLaunchpad(false)} className="text-white/40 hover:text-white transition-colors">
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                  {launchpadApps.slice(0, 30).map((app) => {
                    const firstLetter = app.name.charAt(0).toUpperCase();
                    return (
                      <motion.button
                        key={app.id}
                        onClick={() => handleOpen(app)}
                        className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 transition-colors group"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${app.color || getCategoryColor(app.category || '')} text-lg font-bold text-white shadow-lg group-hover:shadow-xl transition-shadow`}>
                          {firstLetter}
                        </div>
                        <span className="text-[10px] text-white/60 text-center leading-tight line-clamp-2 max-w-[72px]">
                          {app.name}
                        </span>
                        {app.favorite && (
                          <Star size={8} className="text-amber-400" fill="currentColor" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {recentApps.length > 0 && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-white/60" />
              <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Recent</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentApps.map((app) => {
                const firstLetter = app.name.charAt(0).toUpperCase();
                return (
                  <motion.button
                    key={app.id}
                    onClick={() => handleOpen(app)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition-colors"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className={`flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br ${app.color || getCategoryColor(app.category || '')} text-[9px] font-bold text-white`}>
                      {firstLetter}
                    </div>
                    <span className="text-xs text-white/80">{app.name}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {favorites.length > 0 && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-3">
              <Star size={14} className="text-amber-400" />
              <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Favorites</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {favorites.map((app) => {
                const firstLetter = app.name.charAt(0).toUpperCase();
                return (
                  <motion.button
                    key={app.id}
                    onClick={() => handleOpen(app)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className={`flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br ${app.color || getCategoryColor(app.category || '')} text-[9px] font-bold text-white`}>
                      {firstLetter}
                    </div>
                    <span className="text-xs text-white/80">{app.name}</span>
                    <Star size={10} className="text-amber-400" fill="currentColor" />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent max-h-[76px] flex-wrap overflow-y-auto">
            <button
              onClick={() => navTo(null, null)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-all border ${
                !selectedCategory
                  ? 'bg-black/30 border-white/20 text-white'
                  : 'bg-white/10 border-white/10 text-white/60 hover:text-white hover:bg-white/20'
              }`}
            >
              All ({apps.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { const next = selectedCategory === cat ? null : cat; navTo(next, null); }}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-all border whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-black/30 border-white/20 text-white'
                    : 'bg-white/10 border-white/10 text-white/60 hover:text-white hover:bg-white/20'
                }`}
              >
                {cat} ({categoryCounts[cat] || 0})
              </button>
            ))}
            {selectedCategory && (
              <button
                onClick={() => setFolderModalOpen(true)}
                className="shrink-0 flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-medium transition-all border border-dashed border-white/30 text-white/60 hover:text-white hover:border-white/60 hover:bg-white/5"
              >
                <FolderPlus size={13} /> Folder
              </button>
            )}
          </div>
        </motion.div>

        <DragDropContext onDragEnd={handleDragEnd}>
        {/** ─── Folder cards & breadcrumb ─── */}
        {selectedCategory && categoryFolders.length > 0 && !activeFolderId && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                <Folder size={12} /> Folders
              </h2>
              <button
                onClick={() => setFolderModalOpen(true)}
                className="flex items-center gap-1 text-xs font-semibold text-zinc-800/70 hover:text-zinc-950 transition-colors"
              >
                <FolderPlus size={13} /> + New Folder
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {categoryFolders.map((folder) => (
                <Droppable droppableId={folder.id} key={folder.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef as React.Ref<HTMLDivElement>}
                      {...provided.droppableProps}
                      onClick={() => navTo(selectedCategory, folder.id)}
                      className={`group relative bg-black/20 border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                        snapshot.isDraggingOver
                          ? 'border-emerald-400 bg-emerald-500/20 scale-105'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical size={14} className="text-zinc-950/30 hover:text-zinc-950 cursor-grab active:cursor-grabbing shrink-0 transition-colors" />
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-emerald-400 shadow-sm">
                          <Folder size={16} />
                        </div>
                        <span className="text-sm font-semibold text-zinc-950 truncate flex-1 text-left">{folder.name}</span>
                      </div>
                      <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditFolderId(folder.id); setEditFolderName(folder.name); setEditFolderCategory(folder.categoryId); setEditFolderModalOpen(true); }}
                          className="flex h-5 w-5 items-center justify-center rounded-full bg-black/30 text-white/70 hover:bg-black/50 hover:text-white transition-all"
                          title="Rename folder"
                        >
                          <Pencil size={9} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                          className="flex h-5 w-5 items-center justify-center rounded-full bg-black/30 text-white/50 hover:bg-red-500/40 hover:text-red-300 transition-all"
                          title="Delete folder"
                        >
                          <Trash2 size={9} />
                        </button>
                      </div>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </motion.div>
        )}

        {/** ─── Breadcrumb when folder is active ─── */}
        {activeFolderId && currentFolder && (
          <motion.div variants={itemVariants}>
            <nav className="flex items-center gap-2 text-sm font-semibold">
              <button
                onClick={() => navTo(selectedCategory, null)}
                className="text-zinc-800/70 hover:text-zinc-950 transition-colors"
              >
                {selectedCategory || currentFolder.categoryId}
              </button>
              <ChevronRight size={14} className="text-zinc-800/40" />
              <span className="font-bold text-zinc-950">{currentFolder.name}</span>
              <span className="text-xs text-zinc-800/50 ml-2 font-medium">
                ({apps.filter((a) => a.folderId === activeFolderId).length} items)
              </span>
            </nav>
          </motion.div>
        )}

        {/** ─── Search row ─── */}
        <motion.div variants={itemVariants} className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search apps and websites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/10 py-2 pl-9 pr-4 text-sm text-white placeholder-white/30 backdrop-blur-xl transition-colors focus:border-white/30 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <Grid3X3 size={12} />
            <span>{filteredApps.length} of {apps.length}</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          {filteredApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/40">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 mb-4">
                <Search size={28} />
              </div>
              <p className="text-sm font-medium">No apps or websites found</p>
              <p className="text-xs mt-1">Try a different search or add a new one</p>
            </div>
          ) : (
            <Droppable droppableId="app-grid">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 auto-rows-fr'
                    : 'space-y-3'
                  }
                >
                  {filteredApps.map((app, idx) => (
                    <DraggableAppCard
                      key={app.id}
                      app={app}
                      index={idx}
                      onOpen={handleOpen}
                      onToggleFavorite={toggleFavorite}
                      onEdit={openEditModal}
                      onDelete={handleDelete}
                      onContextMenu={setMenuOpenId}
                      isMenuOpen={menuOpenId === app.id}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </motion.div>
        </DragDropContext>
      </motion.div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditingApp(null); setFormData(defaultForm); }}>
        <h2 className="mb-5 text-xl font-bold text-white">{editingApp ? 'Edit' : 'Add'} App or Website</h2>
        <div className="space-y-4">
          <div className="flex gap-2 p-1 rounded-xl bg-white/10 border border-white/10">
            <button
              onClick={() => setFormData({ ...formData, type: 'website', path: '' })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
                formData.type === 'website' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/70'
              }`}
            >
              <Globe size={14} /> Website
            </button>
            <button
              onClick={() => setFormData({ ...formData, type: 'app', url: '' })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
                formData.type === 'app' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/70'
              }`}
            >
              <Monitor size={14} /> Desktop App
            </button>
          </div>

          <Input
            label="Name"
            placeholder="Application or website name..."
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          {formData.type === 'website' ? (
            <Input
              label="URL"
              placeholder="https://example.com"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              icon={<Link size={15} />}
            />
          ) : (
            <Input
              label="Application Path / Protocol"
              placeholder="vscode:// or C:\\Path\\to\\app.exe"
              value={formData.path}
              onChange={(e) => setFormData({ ...formData, path: e.target.value })}
              icon={<FolderOpen size={15} />}
            />
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-white backdrop-blur-xl focus:border-white/30 focus:outline-none"
            >
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Icon Color</label>
            <div className="flex flex-wrap gap-2">
              {gradientColors.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setFormData({ ...formData, color: g.value })}
                  className={`h-7 w-7 rounded-lg bg-gradient-to-br ${g.value} ${
                    formData.color === g.value ? 'ring-2 ring-white ring-offset-1 ring-offset-transparent' : ''
                  } transition-all hover:scale-110`}
                  title={g.name}
                />
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <button
              onClick={() => setFormData({ ...formData, favorite: !formData.favorite })}
              className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
                formData.favorite ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'border-white/20 text-white/30'
              }`}
            >
              {formData.favorite && <Star size={12} fill="currentColor" />}
            </button>
            <span className="text-sm text-white/70">Mark as favorite</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setModalOpen(false); setEditingApp(null); setFormData(defaultForm); }}>Cancel</Button>
            <Button onClick={handleSave}>{editingApp ? 'Save Changes' : 'Add'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={categoryModalOpen} onClose={() => { setCategoryModalOpen(false); setNewCategoryName(''); setEditingCategoryId(null); setEditingCategoryValue(''); }}>
        <h2 className="mb-5 text-xl font-bold text-white">Manage Categories</h2>
        <div className="max-h-[350px] overflow-y-auto pr-2 space-y-3 mb-5 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          {categories.map((cat) => {
            const isEditing = editingCategoryId === cat;
            return (
              <div key={cat} className="flex items-center gap-3 p-3 rounded-xl bg-white/10 border border-white/10">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-white text-xs font-bold`}>
                  {isEditing ? editingCategoryValue.charAt(0).toUpperCase() || cat.charAt(0).toUpperCase() : cat.charAt(0).toUpperCase()}
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editingCategoryValue}
                    onChange={(e) => setEditingCategoryValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameCategory(cat, editingCategoryValue);
                      if (e.key === 'Escape') { setEditingCategoryId(null); setEditingCategoryValue(''); }
                    }}
                    onBlur={() => handleRenameCategory(cat, editingCategoryValue)}
                    className="flex-1 rounded-lg border border-zinc-600/40 bg-zinc-800/60 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-400 focus:border-zinc-500/60 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <span className="flex-1 text-sm font-medium text-zinc-100">{cat}</span>
                )}
                <span className="text-xs text-zinc-400 shrink-0">{categoryCounts[cat] || 0} items</span>
                <button
                  onClick={() => { setEditingCategoryId(cat); setEditingCategoryValue(cat); }}
                  className="text-zinc-400 hover:text-zinc-100 transition-colors"
                  title="Rename category"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => deleteCategory(cat)}
                  className="text-zinc-400 hover:text-red-400 transition-colors"
                  title="Delete category"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
        <Divider className="mb-4" />
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="New category name..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { addCategory(); } }}
            className="flex-1 rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 backdrop-blur-xl focus:border-white/30 focus:outline-none"
          />
          <Button size="sm" onClick={addCategory} disabled={!newCategoryName.trim()}>
            <Plus size={14} /> Add
          </Button>
        </div>
        <div className="flex justify-end pt-4">
          <Button variant="ghost" onClick={() => { setCategoryModalOpen(false); setNewCategoryName(''); setEditingCategoryId(null); setEditingCategoryValue(''); }}>Done</Button>
        </div>
      </Modal>

      {/** ─── New Folder Modal ─── */}
      <Modal open={folderModalOpen} onClose={() => { setFolderModalOpen(false); setNewFolderName(''); }}>
        <h2 className="mb-5 text-xl font-bold text-white">New Folder</h2>
        <p className="text-sm text-white/60 mb-4">
          Create a sub-folder inside <span className="font-semibold text-white">{selectedCategory}</span>
        </p>
        <div className="flex items-center gap-2 mb-6">
          <input
            type="text"
            placeholder="Folder name..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); }}
            className="flex-1 rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 backdrop-blur-xl focus:border-white/30 focus:outline-none"
            autoFocus
          />
          <Button size="sm" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
            <FolderPlus size={14} /> Create
          </Button>
        </div>
        <div className="flex justify-end">
          <Button variant="ghost" onClick={() => { setFolderModalOpen(false); setNewFolderName(''); }}>Cancel</Button>
        </div>
      </Modal>

      <Modal open={editFolderModalOpen} onClose={() => { setEditFolderModalOpen(false); setEditFolderId(null); setEditFolderName(''); setEditFolderCategory(''); }}>
        <h2 className="mb-5 text-xl font-bold text-white">Edit Folder</h2>
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Folder Name</label>
            <input
              type="text"
              placeholder="Folder name..."
              value={editFolderName}
              onChange={(e) => setEditFolderName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateFolder(editFolderId!, editFolderName, editFolderCategory); }}
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 backdrop-blur-xl focus:border-white/30 focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Parent Category</label>
            <select
              value={editFolderCategory}
              onChange={(e) => setEditFolderCategory(e.target.value)}
              className="w-full rounded-xl border border-zinc-700/40 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-100 backdrop-blur-xl focus:border-zinc-500/60 focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-zinc-900 text-zinc-100">{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setEditFolderModalOpen(false); setEditFolderId(null); setEditFolderName(''); setEditFolderCategory(''); }}>Cancel</Button>
            <Button onClick={() => handleUpdateFolder(editFolderId!, editFolderName, editFolderCategory)} disabled={!editFolderName.trim() || !editFolderId}>
              <Pencil size={14} /> Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
