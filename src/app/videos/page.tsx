'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Video,
  Search,
  Plus,
  Heart,
  Eye,
  EyeOff,
  Youtube,
  Bookmark,
  Play,
  Clock,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useLocalStorage } from '@/lib/usePersistence';
import type { Video as VideoType } from '@/types';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

const categories = ['All', 'Learning', 'Tech', 'Design', 'Science', 'Music'] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function VideosPage() {
  const [videos, setVideos] = useLocalStorage<VideoType[]>('videos', []);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newVideo, setNewVideo] = useState({ title: '', url: '', category: 'Tech' as string, notes: '' });

  const filteredVideos = videos.filter((v) => {
    if (searchQuery && !v.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (activeCategory !== 'All' && v.category !== activeCategory) return false;
    if (showFavoritesOnly && !v.favorite) return false;
    return true;
  });

  function toggleFavorite(id: string) {
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, favorite: v.favorite ? 0 : 1 } : v)));
  }

  function toggleWatched(id: string) {
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, watched: v.watched ? 0 : 1 } : v)));
  }

  function addVideo() {
    if (!newVideo.title.trim() || !newVideo.url.trim()) return;
    const video: VideoType = {
      id: generateId(),
      title: newVideo.title,
      url: newVideo.url,
      category: newVideo.category,
      notes: newVideo.notes,
      watched: 0,
      favorite: 0,
      created_at: new Date().toISOString(),
    };
    setVideos((prev) => [video, ...prev]);
    setNewVideo({ title: '', url: '', category: 'Tech', notes: '' });
    setModalOpen(false);
  }

  function deleteVideo(id: string) {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  }

  const learningPlaylists = filteredVideos.filter((v) => v.category === 'Learning');
  const favorites = filteredVideos.filter((v) => v.favorite);

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
              <Video size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Videos</h1>
          </div>
          <Button onClick={() => setModalOpen(true)} icon={<Plus size={16} />}>
            Add Video
          </Button>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-white/30 backdrop-blur-xl transition-colors focus:border-indigo-500/40 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
              showFavoritesOnly
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20'
                : 'bg-white/5 text-white/40 border border-white/5 hover:text-white/70'
            }`}
          >
            <Heart size={13} className={showFavoritesOnly ? 'fill-rose-400' : ''} />
            Favorites
          </button>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        <motion.div variants={itemVariants}>
          {filteredVideos.length === 0 ? (
            <GlassCard className="flex flex-col items-center justify-center py-16">
              <Video size={48} className="text-white/10 mb-4" />
              <p className="text-lg font-medium text-white/30">No videos found</p>
              <p className="text-sm text-white/20 mt-1">Add your first video to get started</p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredVideos.map((video) => (
                <GlassCard key={video.id} className="group p-0 overflow-hidden">
                  <div className="relative aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                    <Youtube size={36} className="text-red-500/60" />
                    {!video.watched && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="warning">
                          <Clock size={10} className="mr-1 inline" />
                          Watch Later
                        </Badge>
                      </div>
                    )}
                    <button
                      onClick={() => toggleWatched(video.id)}
                      className="absolute top-2 right-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/10 text-white/50 hover:text-white transition-colors"
                      title={video.watched ? 'Mark as unwatched' : 'Mark as watched'}
                    >
                      {video.watched ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                    <button
                      onClick={() => toggleFavorite(video.id)}
                      className={`absolute top-2 right-11 flex h-7 w-7 items-center justify-center rounded-full bg-black/10 transition-colors ${
                        video.favorite ? 'text-rose-400' : 'text-white/50 hover:text-rose-400'
                      }`}
                      title={video.favorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart size={13} className={video.favorite ? 'fill-rose-400' : ''} />
                    </button>
                    <button
                      onClick={() => deleteVideo(video.id)}
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/10 text-white/50 hover:text-red-400 transition-colors"
                      title="Delete video"
                    >
                      <Trash2 size={13} />
                    </button>
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                        <Play size={20} className="ml-0.5 text-white" />
                      </div>
                    </a>
                  </div>
                  <div className="p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="default">{video.category}</Badge>
                      {video.watched && (
                        <Badge variant="success">
                          <Eye size={10} className="mr-1 inline" />
                          Watched
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-white leading-snug line-clamp-2">{video.title}</h3>
                    {video.notes && (
                      <p className="mt-1 text-xs text-white/40 line-clamp-1">{video.notes}</p>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </motion.div>

        {learningPlaylists.length > 0 && (
          <motion.div variants={itemVariants}>
            <GlassCard className="p-5">
              <h2 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
                <Bookmark size={18} className="text-sky-400" />
                Learning Playlists
              </h2>
              <div className="space-y-2">
                {learningPlaylists.map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3 border border-white/5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 shrink-0">
                        <Youtube size={16} className="text-red-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{v.title}</p>
                        <p className="text-xs text-white/40">{v.watched ? 'Watched' : 'Not watched yet'}</p>
                      </div>
                    </div>
                    <a href={v.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-white/30 hover:text-white/60 transition-colors">
                      <Play size={14} />
                    </a>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {favorites.length > 0 && (
          <motion.div variants={itemVariants}>
            <GlassCard className="p-5">
              <h2 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
                <Heart size={18} className="text-rose-400" />
                Favorite Videos
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {favorites.map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3 border border-white/5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 shrink-0">
                        <Heart size={14} className="text-rose-400 fill-rose-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{v.title}</p>
                        <Badge variant="default">{v.category}</Badge>
                      </div>
                    </div>
                    <a href={v.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-white/30 hover:text-white/60 transition-colors">
                      <ExternalLink size={14} />
                    </a>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </motion.div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 className="mb-5 text-xl font-bold text-white">Add Video</h2>
        <div className="space-y-4">
          <Input label="Title" placeholder="Video title..." value={newVideo.title} onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })} />
          <Input label="URL" placeholder="https://youtube.com/watch?v=..." value={newVideo.url} onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Category</label>
            <select value={newVideo.category} onChange={(e) => setNewVideo({ ...newVideo, category: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white backdrop-blur-xl focus:border-indigo-500/40 focus:outline-none">
              {categories.filter((c) => c !== 'All').map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <Input label="Notes" placeholder="Optional notes..." value={newVideo.notes} onChange={(e) => setNewVideo({ ...newVideo, notes: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={addVideo}>Add Video</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
