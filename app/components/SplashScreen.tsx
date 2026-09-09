'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const completedRef = useRef(false);

  const finish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current();
  };

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 350);
    const t2 = setTimeout(() => setPhase('out'), 1100);
    const t3 = setTimeout(finish, 1600);
    // Sécurité absolue : forcer la fermeture quoi qu'il arrive
    const tFallback = setTimeout(finish, 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tFallback);
    };
  }, []);

  return (
    <div
      onClick={finish}
      style={{
        position: 'fixed', inset: 0,
        background: 'var(--ink)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
        opacity: phase === 'out' ? 0 : 1,
        transition: phase === 'out' ? 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        pointerEvents: phase === 'out' ? 'none' : 'all',
        cursor: 'pointer',
      }}
    >
      {/* Background glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.15) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Logo block */}
      <div style={{
        textAlign: 'center',
        transform: phase === 'in'
          ? 'scale(0.92) translateY(8px)'
          : phase === 'out'
            ? 'scale(1.04) translateY(-4px)'
            : 'scale(1) translateY(0)',
        opacity: phase === 'out' ? 0 : 1,
        transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease',
      }}>
        {/* Logo Card */}
        <div style={{
          width: '80px', height: '80px',
          borderRadius: 'var(--radius-3xl, 22px)',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
        }}>
          <Image 
            src="/logo.jpg" 
            alt="Logo" 
            width={80} 
            height={80}
            priority
            style={{ objectFit: 'cover' }}
          />
        </div>

        <div style={{
          fontSize: '2.25rem', fontWeight: '800',
          color: '#FFFFFF', letterSpacing: '-0.03em',
          marginBottom: '6px',
        }}>
          My Planner
        </div>

        <div style={{
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.5)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontWeight: '600',
        }}>
          Digital Journal & Todos
        </div>

        {/* Loading bar */}
        <div style={{
          marginTop: '32px',
          width: '120px',
          height: '2px',
          background: 'rgba(255,255,255,0.12)',
          borderRadius: '2px',
          overflow: 'hidden',
          margin: '32px auto 0',
        }}>
          <div style={{
            height: '100%',
            background: 'var(--accent, #3B82F6)',
            borderRadius: '2px',
            animation: 'loadBar 1s cubic-bezier(0.4, 0, 0.2, 1) forwards',
          }} />
        </div>
      </div>

      <style>{`
        @keyframes loadBar {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}
