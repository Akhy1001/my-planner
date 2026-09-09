'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from './components/Sidebar';
import TodayView from './components/TodayView';
import AgendaView from './components/AgendaView';
import HabitsView from './components/HabitsView';
import NotesView from './components/NotesView';
import GoalsView from './components/GoalsView';
import SplashScreen from './components/SplashScreen';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

type Tab = 'today' | 'agenda' | 'habits' | 'notes' | 'goals';

export default function Home() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    setMounted(true);
    try {
      if (sessionStorage.getItem('splash-seen') === '1') {
        setShowSplash(false);
      }
    } catch {}
  }, []);

  const handleSplashComplete = useCallback(() => {
    try {
      sessionStorage.setItem('splash-seen', '1');
    } catch {}
    setShowSplash(false);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/login');
    }
  }, [user, loading, mounted, router]);

  // Per-user profile themes (Section 3.2: Anas Bleu Tech, Rose Pastel Rose)
  const isPinkUser = user?.email === 'rstrpn05@gmail.com';
  const isSandUser = user?.email === 'anas.fz1001@gmail.com';

  useEffect(() => {
    if (isPinkUser) {
      document.documentElement.setAttribute('data-profile', 'rose');
      document.documentElement.setAttribute('data-theme', 'pink');
      document.documentElement.classList.remove('dark');
    } else if (isSandUser) {
      document.documentElement.setAttribute('data-profile', 'anas');
      if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'sand');
        document.documentElement.classList.remove('dark');
      }
    } else {
      document.documentElement.removeAttribute('data-profile');
      if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.classList.remove('dark');
      }
    }
  }, [user, isPinkUser, isSandUser, isDark]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const renderView = () => {
    switch (activeTab) {
      case 'today':  return <TodayView />;
      case 'agenda': return <AgendaView />;
      case 'habits': return <HabitsView />;
      case 'notes':  return <NotesView />;
      case 'goals':  return <GoalsView />;
    }
  };

  // Si l'utilisateur n'est pas connecté et que l'auth a fini de vérifier
  if (mounted && !loading && !user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--ink)',
        color: '#FFFFFF',
        fontFamily: 'inherit',
      }}>
        Redirection…
      </div>
    );
  }

  return (
    <>
      {/* Splash screen overlay */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      {/* Main app */}
      <div
        style={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
          opacity: showSplash ? 0 : 1,
          transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {user && (
          <>
            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              user={user}
              onSignOut={handleSignOut}
              isDark={isDark}
              onToggleTheme={toggleTheme}
              isPinkUser={isPinkUser}
            />
            <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6, scale: 0.99 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  style={{ height: '100%', overflowY: 'auto' }}
                >
                  {renderView()}
                </motion.div>
              </AnimatePresence>
            </main>
          </>
        )}
      </div>
    </>
  );
}
