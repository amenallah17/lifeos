'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Pocket,
  Link,
  StickyNote,
  Code,
  Lightbulb,
  Image,
  Search,
  Star,
  Bookmark,
  Tag,
  Plus,
  Save,
  Clock,
  GripVertical,
  Send,
  Trash2,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useLocalStorage } from '@/lib/usePersistence';
import type { Bookmark as BookmarkType } from '@/types';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

type ItemType = 'link' | 'note' | 'snippet' | 'idea' | 'image';
type CategoryTab = 'all' | 'link' | 'note' | 'snippet' | 'idea' | 'image';

const typeIcons: Record<ItemType, typeof Link> = {
  link: Link,
  note: StickyNote,
  snippet: Code,
  idea: Lightbulb,
  image: Image,
};

const typeLabels: Record<ItemType, string> = {
  link: 'Link',
  note: 'Note',
  snippet: 'Snippet',
  idea: 'Idea',
  image: 'Image',
};

const typeColors: Record<ItemType, string> = {
  link: 'from-sky-500/20 to-blue-500/10 border-sky-500/20',
  note: 'from-amber-500/20 to-orange-500/10 border-amber-500/20',
  snippet: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/20',
  idea: 'from-violet-500/20 to-purple-500/10 border-violet-500/20',
  image: 'from-pink-500/20 to-rose-500/10 border-pink-500/20',
};

const categoryTabs: { id: CategoryTab; label: string; icon: typeof Link }[] = [
  { id: 'all', label: 'All', icon: Pocket },
  { id: 'link', label: 'Links', icon: Link },
  { id: 'note', label: 'Notes', icon: StickyNote },
  { id: 'snippet', label: 'Snippets', icon: Code },
  { id: 'idea', label: 'Ideas', icon: Lightbulb },
  { id: 'image', label: 'Images', icon: Image },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function PocketPage() {
  const [items, setItems] = useLocalStorage<BookmarkType[]>('pocket-items', []);
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [captureType, setCaptureType] = useState<ItemType>('note');
  const [captureContent, setCaptureContent] = useState('');
  const [captureTitle, setCaptureTitle] = useState('');

  const filteredItems = useMemo(() => {
    let result = [...items];
    if (activeTab !== 'all') {
      result = result.filter((i) => i.type === activeTab);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.content || '').toLowerCase().includes(q) ||
          (i.tags || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, activeTab, searchQuery]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    items.forEach((i) => {
      if (i.tags) {
        i.tags.split(',').map((t) => t.trim()).filter(Boolean).forEach((t) => tagSet.add(t));
      }
    });
    return Array.from(tagSet).sort();
  }, [items]);

  const favorites = useMemo(() => items.filter((i) => i.favorite), [items]);

  function toggleFavorite(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, favorite: i.favorite ? 0 : 1 } : i)));
  }

  function deleteItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function handleSave() {
    if (!captureTitle.trim() && !captureContent.trim()) return;
    const item: BookmarkType = {
      id: generateId(),
      type: captureType,
      title: captureTitle.trim() || 'Untitled',
      content: captureContent.trim(),
      tags: '',
      favorite: 0,
      created_at: new Date().toISOString(),
    };
    setItems((prev) => [item, ...prev]);
    setCaptureTitle('');
    setCaptureContent('');
  }

  function truncate(text: string, max: number) {
    return text.length > max ? text.slice(0, max) + '...' : text;
  }

  return (
    <div className="min-h-screen p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl space-y-6"
      >
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/30">
            <Pocket size={20} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">My Pocket</h1>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard className="p-5">
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex-1 min-w-[200px] space-y-2">
                <input
                  type="text"
                  placeholder="Title..."
                  value={captureTitle}
                  onChange={(e) => setCaptureTitle(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-white placeholder-white/30 focus:outline-none"
                />
                <textarea
                  placeholder="Quick capture anything... a link, note, snippet, or idea..."
                  value={captureContent}
                  onChange={(e) => setCaptureContent(e.target.value)}
                  rows={2}
                  className="w-full resize-none bg-transparent text-sm text-white/80 placeholder-white/30 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={captureType}
                  onChange={(e) => setCaptureType(e.target.value as ItemType)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 backdrop-blur-xl focus:border-indigo-500/40 focus:outline-none"
                >
                  {Object.entries(typeLabels).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                <Button onClick={handleSave} icon={<Save size={14} />}>Save</Button>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2">
          {categoryTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-white/50 hover:text-white/70 border border-transparent'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search pocket..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-white/30 backdrop-blur-xl transition-colors focus:border-indigo-500/40 focus:outline-none"
            />
          </div>
        </motion.div>

        {allTags.length > 0 && (
          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2">
            <Tag size={14} className="text-white/30" />
            {allTags.map((tag) => (
              <Badge key={tag} variant="default">{tag}</Badge>
            ))}
          </motion.div>
        )}

        {filteredItems.length === 0 ? (
          <motion.div variants={itemVariants}>
            <GlassCard className="flex flex-col items-center justify-center py-16">
              <Pocket size={48} className="text-white/10 mb-4" />
              <p className="text-lg font-medium text-white/30">Your pocket is empty</p>
              <p className="text-sm text-white/20 mt-1">Save your first link, note, snippet, or idea above</p>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants} className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {filteredItems.map((item) => {
              const TypeIcon = typeIcons[item.type as ItemType];
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="break-inside-avoid group"
                >
                  <GlassCard className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className={`flex items-center gap-2 rounded-lg bg-gradient-to-r ${typeColors[item.type as ItemType]} border px-2.5 py-1`}>
                        <TypeIcon size={12} className="text-white/70" />
                        <span className="text-[11px] font-medium text-white/60">{typeLabels[item.type as ItemType]}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleFavorite(item.id)}
                          className={`transition-colors ${item.favorite ? 'text-amber-400' : 'text-white/20 hover:text-white/40'}`}
                        >
                          <Star size={14} fill={item.favorite ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="text-white/20 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1 leading-snug">{item.title}</h3>
                    <p className="text-xs text-white/50 leading-relaxed mb-3">{truncate(item.content || '', 120)}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {(item.tags || '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="default">{tag}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-white/30">
                        <Clock size={10} />
                        {item.created_at?.slice(0, 10)}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {favorites.length > 0 && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-3">
              <Star size={16} className="text-amber-400" />
              <h2 className="text-lg font-semibold text-white">Favorites</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {favorites.map((item) => {
                const TypeIcon = typeIcons[item.type as ItemType];
                return (
                  <GlassCard key={item.id} className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TypeIcon size={14} className="text-amber-400" />
                      <span className="text-xs text-white/50">{typeLabels[item.type as ItemType]}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                    <p className="text-xs text-white/40">{truncate(item.content || '', 80)}</p>
                  </GlassCard>
                );
              })}
            </div>
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-2 mb-3 mt-4">
            <Bookmark size={16} className="text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Saved Bookmarks</h2>
          </div>
          <GlassCard className="p-4">
            {items.filter((i) => i.type === 'link').length === 0 ? (
              <p className="text-sm text-white/30 text-center py-4">No bookmarks saved yet</p>
            ) : (
              <div className="space-y-2">
                {items.filter((i) => i.type === 'link').map((link) => (
                  <div key={link.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3.5 py-2.5 border border-white/5">
                    <div className="flex items-center gap-3 min-w-0">
                      <Link size={14} className="text-indigo-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{link.title}</p>
                        <p className="text-xs text-white/40 truncate">{link.content}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFavorite(link.id)}
                      className={`shrink-0 ml-2 ${link.favorite ? 'text-amber-400' : 'text-white/20 hover:text-white/40'}`}
                    >
                      <Star size={14} fill={link.favorite ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
