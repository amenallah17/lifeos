'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Layers,
  Plus,
  Brain,
  Clock,
  RotateCcw,
  Trophy,
  BookOpen,
  ChevronRight,
  Inbox,
  Target,
  Trash2,
  ArrowLeft,
  Eye,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useLocalStorage } from '@/lib/usePersistence';
import type { Deck, FlashCard } from '@/types';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function FlashcardsPage() {
  const [decks, setDecks] = useLocalStorage<Deck[]>('flashcard-decks', []);
  const [cards, setCards] = useLocalStorage<FlashCard[]>('flashcard-cards', []);
  const [deckModalOpen, setDeckModalOpen] = useState(false);
  const [newDeck, setNewDeck] = useState({ name: '', description: '' });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [addCardDeckId, setAddCardDeckId] = useState('');

  const [reviewDeckId, setReviewDeckId] = useState<string | null>(null);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewedToday, setReviewedToday] = useLocalStorage<number>('flashcards-reviewed-today', 0);
  const [reviewDates, setReviewDates] = useLocalStorage<string[]>('flashcards-review-dates', []);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<FlashCard | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');
  const [viewingDeckId, setViewingDeckId] = useState<string | null>(null);

  const cardsDueToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return cards.filter((c) => c.next_review == null || c.next_review <= today).length;
  }, [cards]);
  const totalCards = cards.length;
  const dailyGoal = 50;
  const dailyProgress = Math.min(reviewedToday, dailyGoal);

  const dayStreak = useMemo(() => {
    if (reviewDates.length === 0) return 0;
    const unique = [...new Set(reviewDates)].sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let check = today;
    for (const date of unique) {
      if (date === check) {
        streak++;
        const d = new Date(check);
        d.setDate(d.getDate() - 1);
        check = d.toISOString().split('T')[0];
      } else if (date < check) break;
    }
    return streak;
  }, [reviewDates]);

  function getCardCount(deckId: string) {
    return cards.filter((c) => c.deck_id === deckId).length;
  }

  function addDeck() {
    if (!newDeck.name.trim()) return;
    const deck: Deck = {
      id: generateId(),
      name: newDeck.name,
      description: newDeck.description,
      created_at: new Date().toISOString(),
    };
    setDecks((prev) => [deck, ...prev]);
    setNewDeck({ name: '', description: '' });
    setDeckModalOpen(false);
  }

  function deleteDeck(id: string) {
    setDecks((prev) => prev.filter((d) => d.id !== id));
    setCards((prev) => prev.filter((c) => c.deck_id !== id));
    if (viewingDeckId === id) setViewingDeckId(null);
  }

  function handleAddCard() {
    if (!question.trim() || !answer.trim()) return;
    const deckId = viewingDeckId || addCardDeckId || (decks.length > 0 ? decks[0].id : '');
    if (!deckId) return;
    const card: FlashCard = {
      id: generateId(),
      deck_id: deckId,
      front: question.trim(),
      back: answer.trim(),
      ease: 2.5,
      interval: 0,
      repetitions: 0,
      created_at: new Date().toISOString(),
    };
    setCards((prev) => [card, ...prev]);
    setQuestion('');
    setAnswer('');
    setAddCardDeckId('');
    setIsAddModalOpen(false);
  }

  function openAddCardModal() {
    if (decks.length === 0) {
      setDeckModalOpen(true);
      return;
    }
    setQuestion('');
    setAnswer('');
    setAddCardDeckId(decks.length === 1 ? decks[0].id : '');
    setIsAddModalOpen(true);
  }

  function editCard(id: string, front: string, back: string) {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, front, back } : c)));
  }

  function deleteCard(id: string) {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }

  function startReview(deckId: string) {
    const deckCards = cards.filter((c) => c.deck_id === deckId);
    if (deckCards.length === 0) return;
    setViewingDeckId(null);
    setReviewDeckId(deckId);
    setReviewIndex(0);
    setFlipped(false);
  }

  function nextCard() {
    const deckCards = cards.filter((c) => c.deck_id === reviewDeckId);
    if (reviewIndex < deckCards.length - 1) {
      setReviewIndex((i) => i + 1);
      setFlipped(false);
      setReviewedToday((prev) => prev + 1);
      setReviewDates((prev) => {
        const today = new Date().toISOString().split('T')[0];
        return prev.includes(today) ? prev : [...prev, today];
      });
    }
  }

  function deleteCurrentCard() {
    if (!currentCard) return;
    const deckCards = cards.filter((c) => c.deck_id === reviewDeckId);
    const newCards = deckCards.filter((c) => c.id !== currentCard.id);
    setCards((prev) => prev.filter((c) => c.id !== currentCard.id));
    if (newCards.length === 0) {
      endReview();
    } else if (reviewIndex >= newCards.length) {
      setReviewIndex(newCards.length - 1);
    }
  }

  function endReview() {
    setReviewDeckId(null);
    setReviewIndex(0);
    setFlipped(false);
  }

  const reviewDeckIdRef = useRef(reviewDeckId);
  reviewDeckIdRef.current = reviewDeckId;
  const cardsRef = useRef(cards);
  cardsRef.current = cards;
  const reviewIndexRef = useRef(reviewIndex);
  reviewIndexRef.current = reviewIndex;

  useEffect(() => {
    if (!reviewDeckId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped((prev) => !prev);
      } else if (e.key === 'ArrowRight' || e.key === 'n' || e.key === 'N') {
        const currentDeckId = reviewDeckIdRef.current;
        const currentCards = cardsRef.current;
        const deckCards = currentCards.filter((c) => c.deck_id === currentDeckId);
        const currentIdx = reviewIndexRef.current;
        if (currentIdx < deckCards.length - 1) {
          setReviewIndex((i) => i + 1);
          setFlipped(false);
          setReviewedToday((prev) => prev + 1);
          setReviewDates((prev) => {
            const todayDate = new Date().toISOString().split('T')[0];
            return prev.includes(todayDate) ? prev : [...prev, todayDate];
          });
        }
      } else if (e.key === 'Escape') {
        setReviewDeckId(null);
        setReviewIndex(0);
        setFlipped(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reviewDeckId]);

  const reviewCards = useMemo(
    () => (reviewDeckId ? cards.filter((c) => c.deck_id === reviewDeckId) : []),
    [cards, reviewDeckId]
  );
  const currentCard = reviewCards[reviewIndex];

  function openEditModal(card: FlashCard) {
    setEditingCard(card);
    setEditFront(card.front);
    setEditBack(card.back);
    setEditModalOpen(true);
  }

  function saveEdit() {
    if (!editingCard || !editFront.trim() || !editBack.trim()) return;
    editCard(editingCard.id, editFront, editBack);
    setEditModalOpen(false);
    setEditingCard(null);
  }

  return (
    <div className="min-h-screen p-6 bg-emerald-500 text-gray-900">
      {(reviewDeckId ? (
        (() => {
          const deck = decks.find((d) => d.id === reviewDeckId);
          return (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mx-auto max-w-2xl space-y-6"
            >
              <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={endReview}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-gray-800 hover:bg-white/10 hover:text-gray-900 transition-all"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{deck?.name}</h2>
                    <p className="text-sm text-gray-700">{reviewIndex + 1} of {reviewCards.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(currentCard)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-gray-800 hover:bg-white/10 hover:text-gray-900 transition-all"
                  >
                    <BookOpen size={14} />
                  </button>
                  <button
                    onClick={deleteCurrentCard}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-gray-800 hover:bg-red-400/20 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                  <Badge variant="info">{Math.round(((reviewIndex + 1) / reviewCards.length) * 100)}%</Badge>
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${((reviewIndex + 1) / reviewCards.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex justify-center">
                <motion.div
                  key={currentCard?.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full"
                >
                  <GlassCard
                    className="p-8 min-h-[300px] flex flex-col items-center justify-center cursor-pointer"
                    onClick={() => setFlipped(!flipped)}
                    hover
                  >
                    {!flipped ? (
                      <>
                        <Eye size={20} className="text-gray-500 mb-4" />
                        <p className="text-xl font-semibold text-gray-900 text-center">{currentCard?.front}</p>
                        <p className="mt-6 text-xs text-gray-500">Click to reveal answer</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-indigo-600 mb-4">Answer</p>
                        <p className="text-xl text-gray-900 text-center">{currentCard?.back}</p>
                      </>
                    )}
                  </GlassCard>
                </motion.div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex justify-center gap-3">
                {reviewIndex < reviewCards.length - 1 ? (
                  <Button onClick={nextCard} icon={<ChevronRight size={16} />}>
                    Next Card
                  </Button>
                ) : (
                  <Button onClick={endReview} icon={<Brain size={16} />}>
                    Finish Review
                  </Button>
                )}
              </motion.div>
            </motion.div>
          );
        })()
      ) : viewingDeckId ? (
        (() => {
          const deck = decks.find((d) => d.id === viewingDeckId);
          const deckCards = cards.filter((c) => c.deck_id === viewingDeckId);

          if (!deck) {
            return (
              <GlassCard className="flex flex-col items-center gap-3 py-16 max-w-2xl mx-auto">
                <Inbox size={40} className="text-gray-400" />
                <p className="text-sm text-gray-600">Deck not found.</p>
                <Button onClick={() => setViewingDeckId(null)} icon={<ArrowLeft size={16} />}>Go Back</Button>
              </GlassCard>
            );
          }

          return (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mx-auto max-w-4xl space-y-6"
            >
              <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setViewingDeckId(null)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-gray-800 hover:bg-white/10 hover:text-gray-900 transition-all"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{deck.name}</h2>
                    <p className="text-sm text-gray-700">{deckCards.length} card{deckCards.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    icon={<Plus size={16} />}
                    onClick={() => {
                      setQuestion('');
                      setAnswer('');
                      setIsAddModalOpen(true);
                    }}
                    variant="secondary"
                  >
                    Add Card
                  </Button>
                  <Button onClick={() => startReview(viewingDeckId)} icon={<Brain size={16} />}>
                    Start Review
                  </Button>
                </div>
              </motion.div>

              {deckCards.length === 0 ? (
                <motion.div variants={itemVariants}>
                  <GlassCard className="flex flex-col items-center gap-3 py-16">
                    <Inbox size={40} className="text-gray-400" />
                    <p className="text-sm text-gray-600">No cards in this deck yet.</p>
                    <Button
                      icon={<Plus size={16} />}
                      onClick={() => {
                        setQuestion('');
                        setAnswer('');
                        setIsAddModalOpen(true);
                      }}
                    >
                      Add Card
                    </Button>
                  </GlassCard>
                </motion.div>
              ) : (
                <motion.div variants={itemVariants} className="space-y-3">
                  {deckCards.map((card) => (
                    <GlassCard key={card.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">{card.front}</p>
                          <p className="text-sm text-gray-700 truncate mt-1">{card.back}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => openEditModal(card)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-gray-800 hover:bg-white/10 hover:text-gray-900 transition-all"
                          >
                            <BookOpen size={14} />
                          </button>
                          <button
                            onClick={() => deleteCard(card.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-gray-800 hover:bg-red-400/20 hover:text-red-400 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </motion.div>
              )}
            </motion.div>
          );
        })()
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-7xl space-y-6"
        >
          <motion.div variants={itemVariants} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/30">
                <Brain size={20} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Flashcards</h1>
              <Badge variant="info" className="ml-2">{totalCards} cards</Badge>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => setDeckModalOpen(true)} icon={<Plus size={16} />} variant="secondary">New Deck</Button>
              <Button
                icon={<Plus size={16} />}
                onClick={openAddCardModal}
                className="relative shadow-lg shadow-indigo-500/30 before:absolute before:-inset-1 before:rounded-xl before:bg-gradient-to-r before:from-indigo-500/20 before:to-cyan-500/20 before:blur-md"
              >
                Add Card
              </Button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <GlassCard className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10">
                <Clock size={22} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{cardsDueToday}</p>
                <p className="text-xs text-gray-600">Cards Due Today</p>
              </div>
            </GlassCard>
            <GlassCard className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                <Layers size={22} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalCards}</p>
                <p className="text-xs text-gray-600">Total Cards</p>
              </div>
            </GlassCard>
            <GlassCard className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                <RotateCcw size={22} className="text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{reviewedToday}</p>
                <p className="text-xs text-gray-600">Reviews Today</p>
              </div>
            </GlassCard>
            <GlassCard className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10">
                <Trophy size={22} className="text-rose-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{dayStreak}</p>
                <p className="text-xs text-gray-600">Day Streak</p>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-indigo-600" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-600">Daily Review Goal</h3>
                </div>
                <span className="text-sm text-gray-600">{dailyProgress} / {dailyGoal}</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/20">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(dailyProgress / dailyGoal) * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                />
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Your Decks</h2>
            </div>
            {decks.length === 0 ? (
              <GlassCard className="flex flex-col items-center gap-3 py-16">
                <Inbox size={40} className="text-gray-400" />
                <p className="text-sm text-gray-600">No decks yet. Create your first deck to get started.</p>
                <Button onClick={() => setDeckModalOpen(true)} icon={<Plus size={16} />}>Create Deck</Button>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {decks.map((deck) => {
                  const count = getCardCount(deck.id);
                  const progress = count > 0 ? Math.min(100, Math.round((reviewedToday / Math.max(1, count)) * 100)) : 0;
                  return (
                    <GlassCard
                      key={deck.id}
                      hover
                      className="group p-5 cursor-pointer"
                      onClick={() => setViewingDeckId(deck.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg">
                          <BookOpen size={18} className="text-white" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={progress >= 100 ? 'success' : progress >= 50 ? 'warning' : 'default'}>
                            {progress}%
                          </Badge>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteDeck(deck.id); }}
                            className="text-gray-500 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <h3 className="mt-3 text-base font-semibold text-gray-900">{deck.name}</h3>
                      {deck.description && (
                        <p className="mt-1 text-xs text-gray-600">{deck.description}</p>
                      )}
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-600">
                        <span>{count} card{count !== 1 ? 's' : ''}</span>
                        {count > 0 && <span>&middot;</span>}
                        {count > 0 && <span>{reviewedToday} reviewed</span>}
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                      {count > 0 && (
                        <div
                          className="mt-3 flex items-center gap-1 text-xs text-gray-500 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); startReview(deck.id); }}
                        >
                          <span>Start Review</span>
                          <ChevronRight size={12} />
                        </div>
                      )}
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </motion.div>
        </motion.div>
      ))}

      <Modal open={deckModalOpen} onClose={() => setDeckModalOpen(false)}>
        <h2 className="mb-5 text-xl font-bold text-gray-900">New Deck</h2>
        <div className="space-y-4">
          <Input label="Deck Name" placeholder="Enter deck name..." value={newDeck.name} onChange={(e) => setNewDeck({ ...newDeck, name: e.target.value })} />
          <Input label="Description" placeholder="Describe your deck..." value={newDeck.description} onChange={(e) => setNewDeck({ ...newDeck, description: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setDeckModalOpen(false)}>Cancel</Button>
            <Button onClick={addDeck}>Create Deck</Button>
          </div>
        </div>
      </Modal>

      <Modal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
        <h2 className="mb-5 text-xl font-bold text-gray-900">Add Card</h2>
        <form
          onSubmit={(e) => { e.preventDefault(); handleAddCard(); }}
          className="space-y-4"
        >
          <Input label="Front / Question" placeholder="Enter question..." value={question} onChange={(e) => setQuestion(e.target.value)} />
          <Input label="Back / Answer" placeholder="Enter answer..." value={answer} onChange={(e) => setAnswer(e.target.value)} />
          {!viewingDeckId && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-800">Deck</label>
              <select
                value={addCardDeckId}
                onChange={(e) => setAddCardDeckId(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-gray-900 backdrop-blur-xl focus:border-indigo-500/60 focus:outline-none"
              >
                <option value="">Select a deck...</option>
                {decks.map((deck) => (
                  <option key={deck.id} value={deck.id}>{deck.name}</option>
                ))}
              </select>
            </div>
          )}
          {viewingDeckId && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-800">Deck</label>
              <p className="text-sm text-gray-700 bg-white/10 rounded-xl px-4 py-2.5 border border-white/20">
                {decks.find((d) => d.id === viewingDeckId)?.name || 'Unknown deck'}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit">Add Card</Button>
          </div>
        </form>
      </Modal>

      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <h2 className="mb-5 text-xl font-bold text-gray-900">Edit Card</h2>
        <div className="space-y-4">
          <Input label="Front Text" placeholder="Enter question..." value={editFront} onChange={(e) => setEditFront(e.target.value)} />
          <Input label="Back Text" placeholder="Enter answer..." value={editBack} onChange={(e) => setEditBack(e.target.value)} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
