'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, FileText, Terminal, Lightbulb, Send, Command } from 'lucide-react';
import { useStore } from '@/lib/store';

type CaptureType = 'link' | 'note' | 'snippet' | 'idea';

const captureTypes: { id: CaptureType; label: string; icon: React.ReactNode }[] = [
  { id: 'link', label: 'Link', icon: <Link size={16} /> },
  { id: 'note', label: 'Note', icon: <FileText size={16} /> },
  { id: 'snippet', label: 'Snippet', icon: <Terminal size={16} /> },
  { id: 'idea', label: 'Idea', icon: <Lightbulb size={16} /> },
];

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

const panelVariants = {
  hidden: { y: '100%', opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 400, damping: 35 },
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

export default function QuickCapture() {
  const quickCaptureOpen = useStore((s) => s.quickCaptureOpen);
  const setQuickCaptureOpen = useStore((s) => s.setQuickCaptureOpen);
  const [text, setText] = useState('');
  const [type, setType] = useState<CaptureType>('note');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (quickCaptureOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [quickCaptureOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && quickCaptureOpen) {
        setQuickCaptureOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickCaptureOpen, setQuickCaptureOpen]);

  const handleSave = () => {
    if (!text.trim()) return;
    // TODO: persist to DB
    setText('');
    setQuickCaptureOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
  };

  return (
    <AnimatePresence>
      {quickCaptureOpen && (
        <motion.div
          key="quick-capture-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 z-[100] flex items-end justify-center pb-24"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/10 backdrop-blur-sm"
            onClick={() => setQuickCaptureOpen(false)}
          />

          {/* Panel */}
          <motion.div
            key="quick-capture-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-lg rounded-2xl backdrop-blur-xl bg-zinc-900/95 border border-white/10 shadow-2xl p-5 mx-4"
          >
            {/* Type selector */}
            <div className="flex gap-2 mb-4">
              {captureTypes.map((ct) => (
                <motion.button
                  key={ct.id}
                  onClick={() => setType(ct.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    type === ct.id
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'text-white/50 hover:text-white/70 hover:bg-white/5 border border-transparent'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {ct.icon}
                  {ct.label}
                </motion.button>
              ))}
            </div>

            {/* Input */}
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  type === 'link'
                    ? 'Paste a link...'
                    : type === 'snippet'
                    ? 'Paste a code snippet...'
                    : type === 'idea'
                    ? 'What is your idea?'
                    : 'Write a quick note...'
                }
                className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-colors"
              />
            </div>

            {/* Bottom bar */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[11px] text-white/30">
                <Command size={12} className="inline mr-1" />+ Enter to save
              </span>
              <motion.button
                onClick={handleSave}
                className="flex items-center gap-1.5 rounded-lg bg-white/15 px-4 py-2 text-xs font-medium text-white shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                disabled={!text.trim()}
              >
                <Send size={14} />
                Save
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
