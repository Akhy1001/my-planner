'use client';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    if (error) {
      setError('Email ou mot de passe incorrect.');
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Nunito', var(--font-geist-sans), system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative backdrop glows (Section 5) */}
      <div style={{
        position: 'absolute', top: '-100px', right: '-100px',
        width: '450px', height: '450px', borderRadius: '50%',
        background: 'radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-80px', left: '-80px',
        width: '380px', height: '380px', borderRadius: '50%',
        background: 'radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '420px',
        margin: '20px',
        background: 'var(--card)',
        borderRadius: 'var(--radius-2xl, 18px)',
        padding: '44px 36px',
        boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)',
        border: '1px solid var(--border)',
        position: 'relative',
      }}>
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, var(--accent) 0%, var(--accent-hover, #2563EB) 100%)',
          borderRadius: '18px 18px 0 0',
        }} />

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <Image
            src="/logo.jpg"
            alt="My Planner logo"
            width={48}
            height={48}
            style={{ borderRadius: 'var(--radius-md, 8px)', margin: '0 auto 16px', display: 'block' }}
            priority
          />
          <div className="font-display" style={{
            fontSize: '1.75rem', color: 'var(--ink)',
            fontWeight: '700', letterSpacing: '-0.03em',
          }}>
            My Planner
          </div>
          <div style={{
            fontSize: '0.85rem', color: 'var(--stone)',
            marginTop: '4px', fontWeight: '400',
          }}>
            Connectez-vous à votre espace
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block', fontSize: '0.8rem',
              color: 'var(--ink)', fontWeight: '600',
              marginBottom: '6px',
            }}>
              Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              required
              autoComplete="email"
              style={{
                width: '100%', padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md, 8px)',
                background: 'var(--cream)',
                fontSize: '0.875rem', color: 'var(--ink)',
                outline: 'none', fontFamily: 'inherit',
                transition: 'all 0.15s ease',
                boxSizing: 'border-box',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--accent)';
                e.target.style.boxShadow = '0 0 0 3px var(--accent-soft)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{
              display: 'block', fontSize: '0.8rem',
              color: 'var(--ink)', fontWeight: '600',
              marginBottom: '6px',
            }}>
              Mot de passe
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{
                  width: '100%', padding: '10px 42px 10px 14px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md, 8px)',
                  background: 'var(--cream)',
                  fontSize: '0.875rem', color: 'var(--ink)',
                  outline: 'none', fontFamily: 'inherit',
                  transition: 'all 0.15s ease',
                  boxSizing: 'border-box',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--accent)';
                  e.target.style.boxShadow = '0 0 0 3px var(--accent-soft)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--stone)', fontSize: '0.9rem', padding: '0',
                  lineHeight: 1,
                }}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'var(--priority-high-bg)',
              border: '1px solid var(--priority-high)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '10px 14px',
              marginBottom: '18px',
              fontSize: '0.82rem', color: 'var(--priority-high)',
              display: 'flex', alignItems: 'center', gap: '8px',
              fontWeight: '500',
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={!loading ? { scale: 1.02 } : {}}
            whileTap={!loading ? { scale: 0.97 } : {}}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: '100%', padding: '13px',
              background: loading ? 'var(--stone-light)' : 'var(--primary-btn-bg, var(--ink))',
              color: 'var(--primary-btn-fg, var(--cream))',
              border: 'none', borderRadius: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.88rem', fontFamily: 'inherit',
              fontWeight: '600',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: loading ? 'none' : '0 2px 8px var(--primary-btn-shadow, rgba(15, 23, 42, 0.15))',
              transition: 'background 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'var(--primary-btn-hover, var(--ink-light))'; } }}
            onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = 'var(--primary-btn-bg, var(--ink))'; } }}
          >
            {loading ? (
              <>
                <span style={{
                  display: 'inline-block', width: '16px', height: '16px',
                  border: '2.5px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white', borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }} />
                Connexion…
              </>
            ) : (
              'Se connecter →'
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <div style={{
          textAlign: 'center', marginTop: '28px',
          fontSize: '0.72rem', color: 'var(--stone-light)',
        }}>
          Accès réservé aux membres
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
