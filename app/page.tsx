'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './components/Sidebar';
import TodayView from './components/TodayView';
import AgendaView from './components/AgendaView';
import HabitsView from './components/HabitsView';
import NotesView from './components/NotesView';
import GoalsView from './components/GoalsView';
import SplashScreen from './components/SplashScreen';
import { useAuth } from '@/hooks/useAuth';

type Tab = 'today' | 'agenda' | 'habits' | 'notes' | 'goals';

export default function Home() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [showSplash, setShowSplash] = useState(true);
  const [appVisible, setAppVisible] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Apply pink theme for rstrpn05@gmail.com
  useEffect(() => {
    if (user?.email === 'rstrpn05@gmail.com') {
      document.documentElement.setAttribute('data-theme', 'pink');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [user]);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    // Small delay so the app reveals smoothly after splash
    setTimeout(() => setAppVisible(true), 50);
  }, []);

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

  // Auth loading — show nothing (splash covers it)
  if (loading || !user) {
    return (
      <>
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      </>
    );
  }

  return (
    <>
      {/* Splash screen overlay */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      {/* Main app — reveals after splash */}
      <div
        style={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
          opacity: appVisible ? 1 : 0,
          transform: appVisible ? 'scale(1)' : 'scale(0.98)',
          transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          onSignOut={handleSignOut}
        />
        <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <div
            key={activeTab}
            style={{ height: '100%', overflowY: 'auto' }}
            className="animate-fade-in"
          >
            {renderView()}
          </div>
        </main>
      </div>
    </>
  );
}
