'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { Lock } from 'lucide-react';
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

const TAB_ORDER: Tab[] = ['today', 'agenda', 'habits', 'notes', 'goals'];

export default function Home() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutProgress, setSignOutProgress] = useState(0);

  const rawName = user?.email?.split('@')[0] ?? 'Utilisateur';
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  const handleTabChange = (newTab: Tab) => {
    const prevIdx = TAB_ORDER.indexOf(activeTab);
    const newIdx = TAB_ORDER.indexOf(newTab);
    setSlideDirection(newIdx >= prevIdx ? 1 : -1);
    setActiveTab(newTab);
  };

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
    if (mounted && !loading && !user && !isSigningOut) {
      router.push('/login');
    }
  }, [user, loading, mounted, isSigningOut, router]);

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

  const handleSignOut = () => {
    setIsSigningOut(true);
  };

  useEffect(() => {
    if (!isSigningOut) return;

    let startTime: number | null = null;
    const duration = 1800; // 1.8s
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setSignOutProgress(Math.min(eased * 100, 100));

      if (t < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        signOut().then(() => {
          router.push('/login');
        });
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isSigningOut, signOut, router]);

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
  if (mounted && !loading && !user && !isSigningOut) {
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

      {/* Main app with cinematic reveal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showSplash ? 0 : 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: 'flex',
          height: '100vh',
          width: '100vw',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Voile d'apparition théâtral / Cinematic Unveil Curtain */}
        <motion.div
          initial={{ scaleY: 1 }}
          animate={{ scaleY: showSplash ? 1 : 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--cream, #FAFAFA)',
            transformOrigin: 'top',
            zIndex: 9000,
            pointerEvents: 'none',
          }}
        />

        {/* Balayage de lumière douce d'ouverture / Light Sheen */}
        <motion.div
          initial={{ x: '-100%', opacity: 0.6 }}
          animate={{ x: showSplash ? '-100%' : '250%', opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
          style={{
            position: 'fixed',
            top: 0,
            bottom: 0,
            width: '45%',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.7) 50%, transparent 100%)',
            zIndex: 9001,
            pointerEvents: 'none',
          }}
        />

        {user && (
          <>
            {/* Sidebar avec glissement depuis la gauche et déflouage */}
            <motion.div
              initial={{ x: -40, opacity: 0, filter: 'blur(8px)' }}
              animate={{
                x: showSplash ? -40 : 0,
                opacity: showSplash ? 0 : 1,
                filter: showSplash ? 'blur(8px)' : 'blur(0px)',
              }}
              transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'flex', height: '100%', flexShrink: 0 }}
            >
              <Sidebar
                activeTab={activeTab}
                setActiveTab={handleTabChange}
                user={user}
                onSignOut={handleSignOut}
                isDark={isDark}
                onToggleTheme={toggleTheme}
                isPinkUser={isPinkUser}
              />
            </motion.div>

            {/* Contenu principal avec ascension, léger zoom et déflouage */}
            <motion.main
              initial={{ y: 32, opacity: 0, scale: 0.98, filter: 'blur(12px)' }}
              animate={{
                y: showSplash ? 32 : 0,
                opacity: showSplash ? 0 : 1,
                scale: showSplash ? 0.98 : 1,
                filter: showSplash ? 'blur(12px)' : 'blur(0px)',
              }}
              transition={{ duration: 0.8, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              style={{ flex: 1, overflow: 'hidden', position: 'relative' }}
            >
              <AnimatePresence mode="wait" custom={slideDirection} initial={false}>
                <motion.div
                  key={activeTab}
                  custom={slideDirection}
                  variants={{
                    initial: (dir: number) => ({
                      opacity: 0,
                      x: dir > 0 ? 36 : -36,
                      scale: 0.995,
                    }),
                    animate: {
                      opacity: 1,
                      x: 0,
                      scale: 1,
                      transition: {
                        duration: 0.28,
                        ease: [0.16, 1, 0.3, 1],
                      },
                    },
                    exit: (dir: number) => ({
                      opacity: 0,
                      x: dir > 0 ? -28 : 28,
                      scale: 0.995,
                      transition: {
                        duration: 0.2,
                        ease: [0.23, 1, 0.32, 1],
                      },
                    }),
                  }}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{ height: '100%', overflowY: 'auto' }}
                >
                  {renderView()}
                </motion.div>
              </AnimatePresence>
            </motion.main>
          </>
        )}
      </motion.div>

      {/* ── Écran de déconnexion d'adieu immersif ── */}
      <AnimatePresence>
        {isSigningOut && (
          <motion.div
            key="signout-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.35 } }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              fontFamily: "'Nunito', var(--font-geist-sans), system-ui, sans-serif",
            }}
          >
            {/* Farewell Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: '100%',
                maxWidth: '390px',
                background: 'var(--card, #FFFFFF)',
                borderRadius: '24px',
                padding: '38px 32px 30px',
                boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
                border: '1px solid var(--border)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Top monochrome accent line */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3.5px',
                  background: 'linear-gradient(90deg, var(--ink) 0%, var(--stone) 50%, var(--ink) 100%)',
                }}
              />

              {/* Logo Badge with Lock Badge */}
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.2, ease: 'easeInOut' }}
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '20px',
                    background: '#FFFFFF',
                    border: '1px solid var(--border)',
                    boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    src="/logo.jpg"
                    alt="My Planner logo"
                    width={68}
                    height={68}
                    style={{ objectFit: 'contain', width: '100%', height: '100%', display: 'block' }}
                    priority
                  />
                </motion.div>

                {/* Lock icon bubble */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.3, type: 'spring' }}
                  style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-4px',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'var(--ink)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.3)',
                    border: '2px solid var(--card, #FFFFFF)',
                  }}
                >
                  <Lock size={13} />
                </motion.div>
              </div>

              {/* Farewell Title */}
              <h2
                className="font-display"
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: 'var(--ink)',
                  letterSpacing: '-0.025em',
                  marginBottom: '6px',
                }}
              >
                À bientôt, {displayName} !
              </h2>

              <p
                style={{
                  fontSize: '0.84rem',
                  color: 'var(--stone)',
                  fontWeight: 500,
                  marginBottom: '24px',
                }}
              >
                Fermeture sécurisée de votre session…
              </p>

              {/* Vault Progress Bar */}
              <div style={{ width: '100%', marginBottom: '14px' }}>
                <div
                  style={{
                    width: '100%',
                    height: '5px',
                    background: 'var(--muted, #F1F5F9)',
                    borderRadius: '999px',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${signOutProgress}%`,
                      background: 'var(--ink)',
                      borderRadius: '999px',
                      transition: 'width 0.1s linear',
                    }}
                  />
                </div>
              </div>

              {/* Status pill */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.72rem',
                  color: 'var(--stone)',
                  fontWeight: 600,
                }}
              >
                <span>✦</span>
                <span>Vos données et notes sont synchronisées</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
