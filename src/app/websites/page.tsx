'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  Search,
  Plus,
  Star,
  ExternalLink,
  Zap,
  Code,
  GraduationCap,
  LayoutDashboard,
  Palette,
  Brain,
  Cloud,
  Rocket,
  Trash2,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useLocalStorage } from '@/lib/usePersistence';
import type { Website as WebsiteType } from '@/types';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

const categoryConfig: Record<string, { icon: typeof Globe; color: string }> = {
  'AI Tools': { icon: Zap, color: 'from-violet-500 to-purple-600' },
  'Coding': { icon: Code, color: 'from-sky-500 to-blue-600' },
  'University': { icon: GraduationCap, color: 'from-emerald-500 to-teal-600' },
  'Productivity': { icon: LayoutDashboard, color: 'from-amber-500 to-orange-600' },
  'Design': { icon: Palette, color: 'from-pink-500 to-rose-600' },
  'Learning': { icon: Brain, color: 'from-cyan-500 to-indigo-600' },
  'Cloud Tools': { icon: Cloud, color: 'from-indigo-500 to-violet-600' },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function WebsitesPage() {
  const [websites, setWebsites] = useLocalStorage<WebsiteType[]>('websites', []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newSite, setNewSite] = useState({ title: '', url: '', category: 'Coding' });

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    websites.forEach((w) => { counts[w.category || ''] = (counts[w.category || ''] || 0) + 1; });
    return counts;
  }, [websites]);

  const filteredWebsites = useMemo(() => {
    let result = [...websites];
    if (selectedCategory) {
      result = result.filter((w) => w.category === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((w) => w.title.toLowerCase().includes(q) || w.url.toLowerCase().includes(q));
    }
    return result;
  }, [websites, selectedCategory, searchQuery]);

  const favorites = useMemo(() => websites.filter((w) => w.favorite), [websites]);

  function toggleFavorite(id: string) {
    setWebsites((prev) => prev.map((w) => w.id === id ? { ...w, favorite: w.favorite ? 0 : 1 } : w));
  }

  function handleAdd() {
    if (!newSite.title.trim() || !newSite.url.trim()) return;
    const site: WebsiteType = {
      id: generateId(),
      title: newSite.title,
      url: newSite.url.startsWith('http') ? newSite.url : `https://${newSite.url}`,
      category: newSite.category,
      favorite: 0,
      created_at: new Date().toISOString(),
    };
    setWebsites((prev) => [site, ...prev]);
    setNewSite({ title: '', url: '', category: 'Coding' });
    setModalOpen(false);
  }

  function handleDelete(id: string) {
    setWebsites((prev) => prev.filter((w) => w.id !== id));
  }

  function truncateUrl(url: string) {
    return url.replace(/^https?:\/\//, '').length > 30
      ? url.replace(/^https?:\/\//, '').slice(0, 30) + '...'
      : url.replace(/^https?:\/\//, '');
  }

  return (
    <div className="min-h-screen p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl space-y-6"
      >
        <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/30">
              <Globe size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Useful Websites</h1>
          </div>
          <Button onClick={() => setModalOpen(true)} icon={<Plus size={16} />}>Add Website</Button>
        </motion.div>

        {favorites.length > 0 && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-3">
              <Star size={16} className="text-amber-400" />
              <h2 className="text-sm font-semibold text-white/70">Favorites</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {favorites.map((site) => {
                const firstLetter = site.title.charAt(0).toUpperCase();
                return (
                  <GlassCard key={site.id} className="flex items-center gap-2 px-3.5 py-2">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${categoryConfig[site.category || '']?.color || 'from-indigo-500 to-purple-600'} text-[10px] font-bold text-white shrink-0`}>
                      {firstLetter}
                    </div>
                    <span className="text-sm text-white font-medium">{site.title}</span>
                    <button
                      onClick={() => toggleFavorite(site.id)}
                      className="text-amber-400 ml-1"
                    >
                      <Star size={12} fill="currentColor" />
                    </button>
                  </GlassCard>
                );
              })}
            </div>
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Object.entries(categoryConfig).map(([name, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={name}
                onClick={() => setSelectedCategory(selectedCategory === name ? null : name)}
              >
                <GlassCard
                  className={`p-4 text-center transition-all ${
                    selectedCategory === name ? 'ring-1 ring-indigo-500/40' : ''
                  }`}
                  hover
                >
                  <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${config.color}`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <p className="text-xs font-medium text-white/70">{name}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{categoryCounts[name] || 0} sites</p>
                </GlassCard>
              </button>
            );
          })}
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="relative max-w-sm">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search websites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-white/30 backdrop-blur-xl transition-colors focus:border-indigo-500/40 focus:outline-none"
            />
          </div>
        </motion.div>

        {filteredWebsites.length === 0 ? (
          <motion.div variants={itemVariants}>
            <GlassCard className="flex flex-col items-center justify-center py-16">
              <Globe size={48} className="text-white/10 mb-4" />
              <p className="text-lg font-medium text-white/30">No websites found</p>
              <p className="text-sm text-white/20 mt-1">Add your first website to get started</p>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredWebsites.map((site) => {
              const firstLetter = site.title.charAt(0).toUpperCase();
              return (
                <GlassCard key={site.id} className="p-4 group">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${categoryConfig[site.category || '']?.color || 'from-indigo-500 to-purple-600'} text-sm font-bold text-white shadow-lg`}>
                      {firstLetter}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white truncate">{site.title}</h3>
                        <button
                          onClick={() => toggleFavorite(site.id)}
                          className={`shrink-0 transition-colors ${site.favorite ? 'text-amber-400' : 'text-white/20 hover:text-white/40'}`}
                        >
                          <Star size={13} fill={site.favorite ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                      <p className="text-xs text-white/40 truncate mt-0.5">{truncateUrl(site.url)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="default">{site.category}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <ExternalLink size={12} />
                      Open
                    </a>
                    <button
                      onClick={() => handleDelete(site.id)}
                      className="ml-auto text-xs text-white/20 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </GlassCard>
              );
            })}
          </motion.div>
        )}
      </motion.div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 className="mb-5 text-xl font-bold text-white">Add Website</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Title</label>
            <input
              type="text"
              placeholder="Website name..."
              value={newSite.title}
              onChange={(e) => setNewSite({ ...newSite, title: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 backdrop-blur-xl focus:border-indigo-500/40 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">URL</label>
            <input
              type="text"
              placeholder="https://example.com"
              value={newSite.url}
              onChange={(e) => setNewSite({ ...newSite, url: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 backdrop-blur-xl focus:border-indigo-500/40 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Category</label>
            <select
              value={newSite.category}
              onChange={(e) => setNewSite({ ...newSite, category: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white backdrop-blur-xl focus:border-indigo-500/40 focus:outline-none"
            >
              {Object.keys(categoryConfig).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            {Object.keys(categoryConfig).map((cat) => (
              <button
                key={cat}
                onClick={() => setNewSite({ ...newSite, category: cat })}
                className={`h-6 w-6 rounded-full bg-gradient-to-br ${categoryConfig[cat].color} ${
                  newSite.category === cat ? 'ring-2 ring-white ring-offset-1 ring-offset-transparent' : ''
                } transition-all hover:scale-110`}
                title={cat}
              />
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Website</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
