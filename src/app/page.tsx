'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Sparkles, Zap, Shield, Layers, ArrowRight, LogIn, UserPlus,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const features = [
  { icon: Zap, title: 'Lightning Fast', desc: 'Instant capture and retrieval of your thoughts and tasks.' },
  { icon: Layers, title: 'Everything in One Place', desc: 'Tasks, notes, goals, study, media — unified.' },
  { icon: Shield, title: 'Private by Design', desc: 'Your data stays yours. End-to-end encrypted.' },
  { icon: Sparkles, title: 'AI-Powered', desc: 'Smart suggestions and automation at your fingertips.' },
];

const floatingCards = [
  { color: 'rgba(99,102,241,0.15)', top: '10%', left: '5%', delay: 0 },
  { color: 'rgba(244,63,94,0.12)', top: '60%', left: '80%', delay: 1.5 },
  { color: 'rgba(245,158,11,0.12)', top: '75%', left: '10%', delay: 3 },
  { color: 'rgba(16,185,129,0.12)', top: '15%', left: '85%', delay: 0.8 },
];

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-4xl font-bold tracking-tight"
          >
          <span className="bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 bg-clip-text text-transparent">
              LifeOS
            </span>
          </motion.div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-2 w-2 rounded-full bg-indigo-400"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="relative min-h-screen w-screen overflow-hidden bg-gradient-to-b from-emerald-100/50 to-white">
      {floatingCards.map((card, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute h-72 w-72 rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, ${card.color} 0%, transparent 70%)`,
            top: card.top,
            left: card.left,
          }}
          animate={{
            y: [0, -30, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            delay: card.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center px-6 py-20"
      >
        <motion.div variants={itemVariants} className="mt-16 flex items-center gap-2 rounded-full border border-emerald-200/50 bg-white/70 px-5 py-2 text-sm text-gray-600 backdrop-blur-xl">
          <Sparkles size={14} className="text-emerald-500" />
          LifeOS 1.0 — Your new operating system for life
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="mt-8 text-center text-6xl font-bold tracking-tight sm:text-7xl lg:text-8xl"
        >
          <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            LifeOS
          </span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="mt-4 text-center text-lg text-gray-500 sm:text-xl"
        >
          Your Personal Life Operating System
        </motion.p>

        <motion.div variants={itemVariants} className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button
            size="lg"
            icon={<ArrowRight size={18} />}
            onClick={() => router.push('/auth/signup')}
          >
            Get Started
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Learn More
          </Button>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            icon={<LogIn size={14} />}
            onClick={() => router.push('/auth/login')}
          >
            Sign In
          </Button>
          <span className="text-gray-300">|</span>
          <Button
            variant="ghost"
            size="sm"
            icon={<UserPlus size={14} />}
            onClick={() => router.push('/auth/signup')}
          >
            Create Account
          </Button>
        </motion.div>

        <motion.div
          id="features"
          variants={itemVariants}
          className="mt-32 grid w-full grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <GlassCard key={feature.title} hover glow className="p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Icon size={20} />
                </div>
                <h3 className="mb-1 text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.desc}</p>
              </GlassCard>
            );
          })}
        </motion.div>

        <motion.div variants={itemVariants} className="mt-32 text-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} LifeOS. All rights reserved.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
