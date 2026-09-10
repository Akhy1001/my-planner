'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
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
  const [signOutStatus, setSignOutStatus] = useState('Fermeture sécurisée de session…');
  const [signingOutIsPink, setSigningOutIsPink] = useState(false);

  const email = user?.email?.toLowerCase().trim();
  const displayName = email?.startsWith('anas.fz1001@')
    ? 'Anas'
    : email?.startsWith('rstrpn05@')
    ? 'Rose'
    : (() => {
        const rawName = user?.email?.split('@')[0] ?? 'Utilisateur';
        return rawName.charAt(0).toUpperCase() + rawName.slice(1);
      })();

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
      router.replace('/login');
    }
  }, [user, loading, mounted, isSigningOut, router]);

  // Per-user profile themes (Section 3.2: Anas Bleu Tech, Rose Pastel Rose)
  const isPinkUser = user?.email === 'rstrpn05@gmail.com' || Boolean(user?.email?.toLowerCase().includes('rstrpn05'));
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
    setSigningOutIsPink(isPinkUser);
    setIsSigningOut(true);
    setSignOutProgress(0);
    setSignOutStatus('Fermeture sécurisée de session…');
  };

  useEffect(() => {
    if (!isSigningOut) return;

    let startTime: number | null = null;
    const duration = 3200; // 3.2s pour 2 tours complets et déconnexion fluide
    let animationFrameId: number;
    const isRose = signingOutIsPink || isPinkUser;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const current = Math.min(eased * 100, 100);
      setSignOutProgress(current);

      if (current < 28) {
        setSignOutStatus('Fermeture sécurisée de session…');
      } else if (current < 65) {
        setSignOutStatus('Synchronisation de vos données…');
      } else if (current < 92) {
        setSignOutStatus('Sauvegarde de vos notes & tâches…');
      } else {
        setSignOutStatus(isRose ? 'À bientôt, Rose ! 💖' : `À bientôt, ${displayName} !`);
      }

      if (t < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setTimeout(async () => {
          try {
            await signOut();
          } catch {}
          window.location.replace('/login');
        }, 450);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    // Sécurité absolue : forcer la redirection quoi qu'il arrive au bout de 4.5s
    const fallbackTimeout = setTimeout(async () => {
      try {
        await signOut();
      } catch {}
      window.location.replace('/login');
    }, 4500);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(fallbackTimeout);
    };
  }, [isSigningOut, displayName, signingOutIsPink, isPinkUser, signOut]);

  const renderView = () => {
    switch (activeTab) {
      case 'today':  return <TodayView />;
      case 'agenda': return <AgendaView />;
      case 'habits': return <HabitsView />;
      case 'notes':  return <NotesView />;
      case 'goals':  return <GoalsView />;
    }
  };

  // Si l'utilisateur n'est pas connecté ou en attente de vérification d'authentification
  if (!user && !isSigningOut) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--cream, #FAFAFA)',
        }}
      />
    );
  }

  return (
    <>
      {/* Splash screen overlay */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} isPinkUser={isPinkUser} />}

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

      {/* ── Écran de déconnexion plein écran immersif (Monochrome ou Rose selon le compte) ── */}
      <AnimatePresence>
        {isSigningOut && (
          <motion.div
            key="signout-loading-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: 1.05,
              filter: 'blur(12px)',
              transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
            }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: (signingOutIsPink || isPinkUser) ? '#FEF0F5' : 'var(--cream, #FAFAFA)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Nunito', var(--font-geist-sans), system-ui, sans-serif",
              overflow: 'hidden',
            }}
          >
            {/* Ambient subtle backdrop glows */}
            <div
              style={{
                position: 'absolute',
                width: '600px',
                height: '600px',
                borderRadius: '50%',
                background: (signingOutIsPink || isPinkUser)
                  ? 'radial-gradient(circle, rgba(212, 96, 126, 0.16) 0%, rgba(184, 126, 192, 0.08) 50%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(15, 23, 42, 0.05) 0%, transparent 65%)',
                pointerEvents: 'none',
              }}
            />

            {/* Central Block */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {/* ── Logo synchronisé à 100% avec la vitesse de déconnexion (2 tours complets 720°) ── */}
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '20px',
                  background: '#FFFFFF',
                  border: (signingOutIsPink || isPinkUser)
                    ? '1px solid #F0D4E4'
                    : '1px solid var(--border, #E2E8F0)',
                  boxShadow: (signingOutIsPink || isPinkUser)
                    ? '0 14px 34px -6px rgba(212, 96, 126, 0.25), 0 2px 8px rgba(212, 96, 126, 0.1)'
                    : '0 14px 34px -6px rgba(15, 23, 42, 0.14), 0 2px 8px rgba(15, 23, 42, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  marginBottom: '26px',
                  transform: `rotate(${(signOutProgress / 100) * 720}deg) scale(${1 + Math.sin((signOutProgress / 100) * Math.PI * 2) * 0.06})`,
                  willChange: 'transform',
                }}
              >
                <Image
                  src="/logo.jpg"
                  alt="My Planner logo"
                  width={76}
                  height={76}
                  style={{ objectFit: 'contain', width: '100%', height: '100%', display: 'block' }}
                  priority
                />
              </div>

              {/* Titre & Sous-titre dynamique */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.15 }}
                style={{ marginBottom: '24px' }}
              >
                <div
                  className="font-display"
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    color: (signingOutIsPink || isPinkUser) ? '#3B1529' : '#0F172A',
                    letterSpacing: '-0.03em',
                    marginBottom: '4px',
                  }}
                >
                  My Planner
                </div>
                <div
                  style={{
                    fontSize: '0.86rem',
                    color: (signingOutIsPink || isPinkUser) ? '#8A4B6B' : 'var(--stone, #64748B)',
                    fontWeight: 600,
                    minHeight: '20px',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {signOutStatus}
                </div>
              </motion.div>

              {/* ── Barre de chargement avec effet de balayage lumineux (Shimmer) ── */}
              <div style={{ width: '270px' }}>
                {/* Track */}
                <div
                  style={{
                    width: '100%',
                    height: '7px',
                    background: (signingOutIsPink || isPinkUser)
                      ? 'rgba(212, 96, 126, 0.16)'
                      : 'rgba(15, 23, 42, 0.08)',
                    borderRadius: '999px',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.06)',
                  }}
                >
                  {/* Fill avec effet shimmer */}
                  <div
                    style={{
                      height: '100%',
                      width: `${signOutProgress}%`,
                      background: (signingOutIsPink || isPinkUser)
                        ? 'linear-gradient(90deg, #D4607E 0%, #F0A8BC 35%, #FFFFFF 50%, #F0A8BC 65%, #D4607E 100%)'
                        : 'linear-gradient(90deg, #0F172A 0%, #334155 35%, #FFFFFF 50%, #334155 65%, #0F172A 100%)',
                      backgroundSize: '240% 100%',
                      animation: 'barShimmer 1.4s infinite linear',
                      borderRadius: '999px',
                      position: 'relative',
                      boxShadow: (signingOutIsPink || isPinkUser)
                        ? '0 0 12px rgba(212, 96, 126, 0.45)'
                        : '0 0 10px rgba(15, 23, 42, 0.35)',
                      willChange: 'width',
                    }}
                  />
                </div>

                {/* Pourcentage et label */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '10px',
                    fontSize: '0.75rem',
                    color: (signingOutIsPink || isPinkUser) ? '#8A4B6B' : 'var(--stone, #64748B)',
                    fontWeight: 600,
                  }}
                >
                  <span>Déconnexion</span>
                  <span
                    style={{
                      color: (signingOutIsPink || isPinkUser) ? '#D4607E' : '#0F172A',
                      fontWeight: 800,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {Math.round(signOutProgress)}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
