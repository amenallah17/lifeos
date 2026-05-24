'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

interface QuoteItem {
  text: string;
  author: string;
}

const quotes: QuoteItem[] = [
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'Code is like humor. When you have to explain it, it\'s bad.', author: 'Cory House' },
  { text: 'First, solve the problem. Then, write the code.', author: 'John Johnson' },
  { text: 'Talk is cheap. Show me the code.', author: 'Linus Torvalds' },
  { text: 'Programs must be written for people to read, and only incidentally for machines to execute.', author: 'Harold Abelson' },
  { text: 'The best way to predict the future is to invent it.', author: 'Alan Kay' },
  { text: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
  { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { text: 'The expert in anything was once a beginner.', author: 'Helen Hayes' },
  { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
  { text: 'Make it work, make it right, make it fast.', author: 'Kent Beck' },
  { text: 'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.', author: 'Martin Fowler' },
];

export default function QuoteWidget() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % quotes.length);
    }, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <GlassCard className="relative overflow-hidden p-5" glow>
      <Quote size={16} className="absolute right-4 top-4 text-emerald-500/20" />
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <p className="text-sm leading-relaxed text-gray-700">&ldquo;{quotes[index].text}&rdquo;</p>
          <p className="mt-3 text-xs font-medium text-gray-400">&mdash; {quotes[index].author}</p>
        </motion.div>
      </AnimatePresence>
    </GlassCard>
  );
}
