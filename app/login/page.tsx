'use client';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
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
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 50% 25%, rgba(59, 130, 246, 0.06) 0%, transparent 65%), var(--cream, #FAFAFA)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Nunito', var(--font-geist-sans), system-ui, sans-serif",
        position: 'relative',
        overflow: 'hidden',
        padding: '24px',
      }}
    >
      {/* Subtle background ambient halos */}
      <div
        style={{
          position: 'absolute',
          top: '-120px',
          right: '-100px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--accent-soft, rgba(59, 130, 246, 0.08)) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-120px',
          left: '-100px',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--accent-soft, rgba(59, 130, 246, 0.08)) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: '430px',
          background: 'var(--card, #FFFFFF)',
          borderRadius: '20px',
          padding: '40px 36px',
          boxShadow: '0 12px 40px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04)',
          border: '1px solid var(--border)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.08 }}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'var(--warm-white)',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              overflow: 'hidden',
            }}
          >
            <Image
              src="/logo.jpg"
              alt="My Planner logo"
              width={60}
              height={60}
              style={{ objectFit: 'cover' }}
              priority
            />
          </motion.div>

          <h1
            className="font-display"
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: 'var(--ink)',
              letterSpacing: '-0.03em',
              marginBottom: '4px',
            }}
          >
            My Planner
          </h1>
          <p
            style={{
              fontSize: '0.86rem',
              color: 'var(--stone)',
              fontWeight: 500,
            }}
          >
            Connectez-vous à votre espace personnel
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Email input */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.76rem',
                color: 'var(--stone)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
              }}
            >
              Adresse email
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--stone)',
                  pointerEvents: 'none',
                }}
              >
                <Mail size={16} />
              </span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 40px',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  background: 'var(--cream, #FAFAFA)',
                  fontSize: '0.88rem',
                  color: 'var(--ink)',
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
                  boxSizing: 'border-box',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--ink)';
                  e.target.style.background = 'var(--card, #FFFFFF)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(15, 23, 42, 0.06)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.background = 'var(--cream, #FAFAFA)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.76rem',
                color: 'var(--stone)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
              }}
            >
              Mot de passe
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--stone)',
                  pointerEvents: 'none',
                }}
              >
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '11px 42px 11px 40px',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  background: 'var(--cream, #FAFAFA)',
                  fontSize: '0.88rem',
                  color: 'var(--ink)',
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
                  boxSizing: 'border-box',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--ink)';
                  e.target.style.background = 'var(--card, #FFFFFF)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(15, 23, 42, 0.06)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.background = 'var(--cream, #FAFAFA)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--stone)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  borderRadius: '6px',
                  transition: 'color 0.15s ease',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'var(--priority-high-bg, rgba(239, 68, 68, 0.08))',
                border: '1px solid var(--priority-high, #EF4444)',
                borderRadius: '12px',
                padding: '10px 14px',
                fontSize: '0.82rem',
                color: 'var(--priority-high, #EF4444)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>⚠</span> {error}
            </motion.div>
          )}

          {/* Submit button */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={!loading ? { scale: 1.015, y: -1 } : {}}
            whileTap={!loading ? { scale: 0.985 } : {}}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: '100%',
              padding: '13px 18px',
              marginTop: '4px',
              background: loading ? 'var(--stone-light)' : 'var(--primary-btn-bg, var(--ink))',
              color: 'var(--primary-btn-fg, var(--cream))',
              border: 'none',
              borderRadius: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: loading ? 'none' : '0 4px 14px var(--primary-btn-shadow, rgba(15, 23, 42, 0.16))',
              transition: 'background 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={e => {
              if (!loading) e.currentTarget.style.background = 'var(--primary-btn-hover, var(--ink-light))';
            }}
            onMouseLeave={e => {
              if (!loading) e.currentTarget.style.background = 'var(--primary-btn-bg, var(--ink))';
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    border: '2.5px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                  }}
                />
                Connexion en cours…
              </>
            ) : (
              <>
                Se connecter
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </form>

        {/* Footer info */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '28px',
            fontSize: '0.74rem',
            color: 'var(--stone)',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <span>✦</span>
          <span>Accès réservé aux membres · My Planner</span>
        </div>
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
