'use client';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
      background: 'linear-gradient(135deg, #F8F6F2 0%, #F0EDE6 50%, #EDE8E0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Nunito', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative blobs */}
      <div style={{
        position: 'absolute', top: '-120px', right: '-120px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(107,143,113,0.15) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-80px', left: '-80px',
        width: '380px', height: '380px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(128,117,168,0.12) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '40%', left: '12%',
        width: '200px', height: '200px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(192,99,74,0.08) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '420px',
        margin: '20px',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '32px',
        padding: '52px 48px',
        boxShadow: '0 20px 80px rgba(24, 24, 27, 0.10), 0 4px 16px rgba(24,24,27,0.05)',
        border: '1px solid rgba(255,255,255,0.8)',
        position: 'relative',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <Image
            src="/logo.jpg"
            alt="Mon Planner logo"
            width={52}
            height={52}
            style={{ borderRadius: '18px', margin: '0 auto 16px', display: 'block' }}
            priority
          />
          <div className="font-display" style={{
            fontSize: '1.8rem', color: 'var(--ink)',
            fontWeight: '700', letterSpacing: '-0.04em',
          }}>
            Mon Planner
          </div>
          <div style={{
            fontSize: '0.8rem', color: 'var(--stone)',
            marginTop: '6px', fontWeight: '400',
          }}>
            Connectez-vous à votre espace
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{
              display: 'block', fontSize: '0.75rem',
              color: 'var(--ink)', fontWeight: '600',
              letterSpacing: '0.02em', marginBottom: '7px',
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
                width: '100%', padding: '13px 18px',
                border: '2px solid var(--border)',
                borderRadius: '16px',
                background: 'var(--cream)',
                fontSize: '0.9rem', color: 'var(--ink)',
                outline: 'none', fontFamily: 'inherit',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--ink)'; e.target.style.background = 'white'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--cream)'; }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block', fontSize: '0.75rem',
              color: 'var(--ink)', fontWeight: '600',
              letterSpacing: '0.02em', marginBottom: '7px',
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
                  width: '100%', padding: '13px 48px 13px 18px',
                  border: '2px solid var(--border)',
                  borderRadius: '16px',
                  background: 'var(--cream)',
                  fontSize: '0.9rem', color: 'var(--ink)',
                  outline: 'none', fontFamily: 'inherit',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--ink)'; e.target.style.background = 'white'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--cream)'; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '16px', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--stone)', fontSize: '1rem', padding: '0',
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
              background: 'rgba(192,99,74,0.08)',
              border: '1.5px solid rgba(192,99,74,0.25)',
              borderRadius: '14px',
              padding: '11px 16px',
              marginBottom: '16px',
              fontSize: '0.83rem', color: 'var(--terra)',
              display: 'flex', alignItems: 'center', gap: '8px',
              fontWeight: '500',
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '15px',
              background: loading ? 'var(--stone-light)' : 'var(--ink)',
              color: 'white',
              border: 'none', borderRadius: '18px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem', fontFamily: 'inherit',
              fontWeight: '600', letterSpacing: '0.01em',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(24, 24, 27, 0.25)',
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(24,24,27,0.3)'; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 20px rgba(24, 24, 27, 0.25)'; }}
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
          </button>
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
