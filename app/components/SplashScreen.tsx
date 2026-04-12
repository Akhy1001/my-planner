'use client';
import { useState, useEffect } from 'react';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 400);
    const t2 = setTimeout(() => setPhase('out'), 1200);
    const t3 = setTimeout(onComplete, 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--ink)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      opacity: phase === 'out' ? 0 : 1,
      transition: phase === 'out' ? 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      pointerEvents: phase === 'out' ? 'none' : 'all',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(107,143,113,0.12) 0%, transparent 65%)',
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
        {/* Icon */}
        <div style={{
          width: '56px', height: '56px',
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '1.4rem',
          backdropFilter: 'blur(8px)',
        }}>
          ✦
        </div>

        <div style={{
          fontSize: '2rem', fontWeight: '700',
          color: 'white', letterSpacing: '-0.04em',
          marginBottom: '6px',
        }}>
          Mon Planner
        </div>

        <div style={{
          fontSize: '0.72rem',
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
          Digital Journal
        </div>

        {/* Loading bar */}
        <div style={{
          marginTop: '32px',
          width: '120px',
          height: '2px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '2px',
          overflow: 'hidden',
          margin: '32px auto 0',
        }}>
          <div style={{
            height: '100%',
            background: 'rgba(255,255,255,0.4)',
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
