'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Search,
  Plus,
  Star,
  Quote,
  ChevronDown,
  ChevronUp,
  BookMarked,
  Library,
  TrendingUp,
  Book,
  Clock,
  Trash2,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ProgressBar from '@/components/ui/ProgressBar';
import { useLocalStorage } from '@/lib/usePersistence';
import type { Book as BookType } from '@/types';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

type BookStatus = 'to-read' | 'reading' | 'finished';

interface BookNote {
  id: string;
  text: string;
  date: string;
}

interface BookWithDetails extends Omit<BookType, "notes"> {
  pages: number;
  pagesRead: number;
  category: string;
  color: string;
  notes: BookNote[];
  progress: number;
}

const categoryGradients: Record<string, string> = {
  'Self-Improvement': 'from-emerald-600 to-teal-700',
  'Technology': 'from-sky-600 to-blue-700',
  'Design': 'from-violet-600 to-purple-700',
  'Business': 'from-amber-600 to-orange-700',
  'Science': 'from-cyan-600 to-indigo-700',
  'Fiction': 'from-pink-600 to-rose-700',
};

const statusTabs: { id: BookStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'to-read', label: 'To Read' },
  { id: 'reading', label: 'Currently Reading' },
  { id: 'finished', label: 'Finished' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function BooksPage() {
  const [books, setBooks] = useLocalStorage<BookWithDetails[]>('books', []);
  const [activeTab, setActiveTab] = useState<BookStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBook, setExpandedBook] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', category: 'Self-Improvement', pages: '', rating: 0, progress: 0 });

  const totalPagesRead = useMemo(() => books.reduce((sum, b) => sum + b.pagesRead, 0), [books]);
  const currentlyReading = useMemo(() => books.filter((b) => b.status === 'reading'), [books]);
  const booksThisYear = useMemo(() => books.filter((b) => b.status === 'finished').length, [books]);

  const filteredBooks = useMemo(() => {
    let result = [...books];
    if (activeTab !== 'all') {
      result = result.filter((b) => b.status === activeTab);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((b) => b.title.toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q));
    }
    return result;
  }, [books, activeTab, searchQuery]);

  function handleAddBook() {
    if (!newBook.title.trim() || !newBook.author.trim()) return;
    const book: BookWithDetails = {
      id: generateId(),
      title: newBook.title,
      author: newBook.author,
      status: 'to-read',
      rating: newBook.rating,
      progress: newBook.progress,
      pages: parseInt(newBook.pages) || 0,
      pagesRead: Math.round((newBook.progress / 100) * (parseInt(newBook.pages) || 0)),
      category: newBook.category,
      notes: [],
      color: categoryGradients[newBook.category] || 'from-indigo-600 to-purple-700',
      created_at: new Date().toISOString(),
    };
    setBooks((prev) => [book, ...prev]);
    setNewBook({ title: '', author: '', category: 'Self-Improvement', pages: '', rating: 0, progress: 0 });
    setModalOpen(false);
  }

  function deleteBook(id: string) {
    setBooks((prev) => prev.filter((b) => b.id !== id));
  }

  function updateBookProgress(id: string, progress: number) {
    setBooks((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              progress,
              pagesRead: Math.round((progress / 100) * b.pages),
              status: progress >= 100 ? 'finished' as const : progress > 0 ? 'reading' as const : 'to-read' as const,
            }
          : b,
      ),
    );
  }

  function renderStars(rating: number = 0) {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={12} className={i < rating ? 'text-amber-400' : 'text-white/10'} fill={i < rating ? 'currentColor' : 'none'} />
    ));
  }

  const statusBadge: Record<BookStatus, 'info' | 'warning' | 'success'> = {
    'to-read': 'info',
    'reading': 'warning',
    'finished': 'success',
  };

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
              <BookOpen size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Book Library</h1>
          </div>
          <Button onClick={() => setModalOpen(true)} icon={<Plus size={16} />}>Add Book</Button>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <Library size={18} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{books.length}</p>
              <p className="text-xs text-white/40">Total Books</p>
            </div>
          </GlassCard>
          <GlassCard className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <TrendingUp size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{booksThisYear}</p>
              <p className="text-xs text-white/40">Books This Year</p>
            </div>
          </GlassCard>
          <GlassCard className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Book size={18} className="text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{currentlyReading.length}</p>
              <p className="text-xs text-white/40">Currently Reading</p>
            </div>
          </GlassCard>
          <GlassCard className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <BookMarked size={18} className="text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalPagesRead.toLocaleString()}</p>
              <p className="text-xs text-white/40">Pages Read</p>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-white/50 hover:text-white/70 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="relative max-w-sm">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-white/30 backdrop-blur-xl transition-colors focus:border-indigo-500/40 focus:outline-none"
            />
          </div>
        </motion.div>

        {filteredBooks.length === 0 ? (
          <motion.div variants={itemVariants}>
            <GlassCard className="flex flex-col items-center justify-center py-16">
              <BookOpen size={48} className="text-white/10 mb-4" />
              <p className="text-lg font-medium text-white/30">No books found</p>
              <p className="text-sm text-white/20 mt-1">Add your first book to get started</p>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBooks.map((book) => (
              <div key={book.id}>
                <GlassCard className="p-0 overflow-hidden">
                  <div className={`h-32 bg-gradient-to-br ${book.color} flex items-end p-4 relative`}>
                    <div>
                      <p className="text-lg font-bold text-white leading-tight">{book.title}</p>
                      <p className="text-xs text-white/60 mt-0.5">{book.author}</p>
                    </div>
                    <button
                      onClick={() => deleteBook(book.id)}
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/10 text-white/50 hover:text-red-400 transition-colors"
                      title="Delete book"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant={statusBadge[book.status]}>
                        {book.status === 'to-read' ? 'To Read' : book.status === 'reading' ? 'Reading' : 'Finished'}
                      </Badge>
                      <div className="flex items-center gap-0.5">
                        {renderStars(book.rating)}
                      </div>
                    </div>
                    {book.status === 'reading' && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/50">{book.pagesRead}/{book.pages} pages</span>
                          <span className="text-indigo-400 font-medium">{book.progress}%</span>
                        </div>
                        <div
                          className="h-1.5 rounded-full bg-white/5 overflow-hidden cursor-pointer group/progress"
                          onClick={() => {
                            const next = book.progress >= 100 ? 0 : Math.min(book.progress + 10, 100);
                            updateBookProgress(book.id, next);
                          }}
                          title="Click to increase progress by 10%"
                        >
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500"
                            style={{ width: `${book.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {book.status === 'finished' && (
                      <p className="text-xs text-white/40">{book.pages} pages</p>
                    )}
                    {book.notes.length > 0 && (
                      <div className="pt-1 border-t border-white/5">
                        <button
                          onClick={() => setExpandedBook(expandedBook === book.id ? null : book.id)}
                          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors"
                        >
                          {expandedBook === book.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {book.notes.length} {book.notes.length === 1 ? 'note' : 'notes'}
                        </button>
                        {expandedBook === book.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-2 space-y-2"
                          >
                            {book.notes.map((note) => (
                              <div key={note.id} className="rounded-lg bg-white/5 p-2.5 border border-white/5">
                                <p className="text-xs text-white/70 leading-relaxed">{note.text}</p>
                                <p className="text-[10px] text-white/30 mt-1">{note.date}</p>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                </GlassCard>
              </div>
            ))}
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-2 mb-3">
            <Quote size={16} className="text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Favorite Quotes</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <GlassCard className="flex flex-col items-center justify-center py-12 col-span-full">
              <Quote size={32} className="text-white/10 mb-3" />
              <p className="text-sm text-white/30">Quotes coming soon</p>
            </GlassCard>
          </div>
        </motion.div>
      </motion.div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 className="mb-5 text-xl font-bold text-white">Add New Book</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Title</label>
            <input
              type="text"
              placeholder="Book title..."
              value={newBook.title}
              onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 backdrop-blur-xl focus:border-indigo-500/40 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Author</label>
            <input
              type="text"
              placeholder="Author name..."
              value={newBook.author}
              onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 backdrop-blur-xl focus:border-indigo-500/40 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Status</label>
            <select
              value={newBook.progress === 100 ? 'finished' : newBook.progress > 0 ? 'reading' : 'to-read'}
              onChange={(e) => {
                const s = e.target.value;
                if (s === 'finished') setNewBook({ ...newBook, progress: 100 });
                else if (s === 'reading') setNewBook({ ...newBook, progress: Math.max(newBook.progress, 1) });
                else setNewBook({ ...newBook, progress: 0 });
              }}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white backdrop-blur-xl focus:border-indigo-500/40 focus:outline-none"
            >
              <option value="to-read">To Read</option>
              <option value="reading">Currently Reading</option>
              <option value="finished">Finished</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Progress (0-100%)</label>
            <input
              type="range"
              min={0}
              max={100}
              value={newBook.progress}
              onChange={(e) => setNewBook({ ...newBook, progress: parseInt(e.target.value) })}
              className="w-full accent-indigo-500"
            />
            <span className="text-xs text-white/50">{newBook.progress}%</span>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Rating (1-5)</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  onClick={() => setNewBook({ ...newBook, rating: newBook.rating === r ? 0 : r })}
                  className={`p-1 transition-colors ${r <= newBook.rating ? 'text-amber-400' : 'text-white/20 hover:text-white/40'}`}
                >
                  <Star size={20} fill={r <= newBook.rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Category</label>
            <select
              value={newBook.category}
              onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white backdrop-blur-xl focus:border-indigo-500/40 focus:outline-none"
            >
              {Object.keys(categoryGradients).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Total Pages</label>
            <input
              type="number"
              placeholder="e.g. 320"
              value={newBook.pages}
              onChange={(e) => setNewBook({ ...newBook, pages: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 backdrop-blur-xl focus:border-indigo-500/40 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddBook}>Add Book</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

