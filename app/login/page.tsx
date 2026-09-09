'use client';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

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
        background: 'radial-gradient(ellipse at 50% 15%, rgba(59, 130, 246, 0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 60%), var(--cream, #FAFAFA)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Nunito', var(--font-geist-sans), system-ui, sans-serif",
        position: 'relative',
        overflow: 'hidden',
        padding: '24px',
      }}
    >
      {/* ── Dynamic Ambient Color Orbs ── */}
      <div
        style={{
          position: 'absolute',
          top: '5%',
          left: '12%',
          width: '480px',
          height: '480px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.22) 0%, rgba(37, 99, 235, 0.08) 50%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
          animation: 'floatOrb1 14s ease-in-out infinite alternate',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '8%',
          right: '10%',
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.07) 50%, transparent 70%)',
          filter: 'blur(55px)',
          pointerEvents: 'none',
          animation: 'floatOrb2 16s ease-in-out infinite alternate',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '38%',
          right: '22%',
          width: '360px',
          height: '360px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, rgba(249, 115, 22, 0.06) 50%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          animation: 'floatOrb3 18s ease-in-out infinite alternate',
        }}
      />

      {/* ── Main Glassmorphism Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: '430px',
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '22px',
          padding: '42px 36px 36px',
          boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.09), 0 10px 20px -5px rgba(59, 130, 246, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.9) inset',
          border: '1px solid rgba(226, 232, 240, 0.85)',
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Glowing Gradient Accent Beam on top edge */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3.5px',
            background: 'linear-gradient(90deg, #3B82F6, #8B5CF6 50%, #EC4899 100%)',
            boxShadow: '0 2px 14px rgba(139, 92, 246, 0.5)',
          }}
        />

        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          {/* Logo Badge with colorful glow */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              background: '#FFFFFF',
              padding: '3px',
              border: '1px solid rgba(255, 255, 255, 0.9)',
              boxShadow: '0 10px 28px -4px rgba(59, 130, 246, 0.35), 0 0 14px rgba(139, 92, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              position: 'relative',
            }}
          >
            <div style={{ width: '100%', height: '100%', borderRadius: '14px', overflow: 'hidden', position: 'relative' }}>
              <Image
                src="/logo.jpg"
                alt="My Planner logo"
                width={64}
                height={64}
                style={{ objectFit: 'cover' }}
                priority
              />
            </div>
          </motion.div>

          {/* Sparkle badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#2563EB',
              marginBottom: '10px',
              letterSpacing: '0.02em',
            }}
          >
            <Sparkles size={12} style={{ color: '#8B5CF6' }} />
            <span>Digital Journal & Todos</span>
          </div>

          <h1
            className="font-display"
            style={{
              fontSize: '1.95rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #0F172A 35%, #2563EB 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
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
                color: focusedField === 'email' ? '#2563EB' : 'var(--stone)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
                transition: 'color 0.2s ease',
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
                  color: focusedField === 'email' ? '#2563EB' : 'var(--stone)',
                  pointerEvents: 'none',
                  transition: 'color 0.2s ease',
                }}
              >
                <Mail size={16} />
              </span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="vous@exemple.com"
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 40px',
                  border: focusedField === 'email' ? '1.5px solid #3B82F6' : '1px solid var(--border)',
                  borderRadius: '12px',
                  background: focusedField === 'email' ? '#FFFFFF' : 'rgba(248, 250, 252, 0.8)',
                  fontSize: '0.88rem',
                  color: 'var(--ink)',
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                  boxShadow: focusedField === 'email' ? '0 0 0 4px rgba(59, 130, 246, 0.16), 0 4px 12px rgba(59, 130, 246, 0.08)' : 'none',
                  boxSizing: 'border-box',
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
                color: focusedField === 'password' ? '#2563EB' : 'var(--stone)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
                transition: 'color 0.2s ease',
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
                  color: focusedField === 'password' ? '#2563EB' : 'var(--stone)',
                  pointerEvents: 'none',
                  transition: 'color 0.2s ease',
                }}
              >
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '11px 42px 11px 40px',
                  border: focusedField === 'password' ? '1.5px solid #3B82F6' : '1px solid var(--border)',
                  borderRadius: '12px',
                  background: focusedField === 'password' ? '#FFFFFF' : 'rgba(248, 250, 252, 0.8)',
                  fontSize: '0.88rem',
                  color: 'var(--ink)',
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                  boxShadow: focusedField === 'password' ? '0 0 0 4px rgba(59, 130, 246, 0.16), 0 4px 12px rgba(59, 130, 246, 0.08)' : 'none',
                  boxSizing: 'border-box',
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
                  color: showPassword ? '#2563EB' : 'var(--stone)',
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

          {/* Submit button with vibrant gradient and glow effect */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={!loading ? { scale: 1.015, y: -1 } : {}}
            whileTap={!loading ? { scale: 0.985 } : {}}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: '100%',
              padding: '13px 18px',
              marginTop: '6px',
              background: loading
                ? 'var(--stone-light)'
                : 'linear-gradient(135deg, #2563EB 0%, #3B82F6 45%, #7C3AED 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.92rem',
              fontFamily: 'inherit',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: loading
                ? 'none'
                : '0 8px 24px -4px rgba(37, 99, 235, 0.45), 0 2px 6px rgba(124, 58, 237, 0.25)',
              transition: 'box-shadow 0.25s ease, filter 0.25s ease',
            }}
            onMouseEnter={e => {
              if (!loading) e.currentTarget.style.filter = 'brightness(1.08)';
            }}
            onMouseLeave={e => {
              if (!loading) e.currentTarget.style.filter = 'none';
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
                <span>Se connecter</span>
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </form>

        {/* Footer info */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '26px',
            fontSize: '0.74rem',
            color: 'var(--stone)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <span style={{ color: '#8B5CF6' }}>✦</span>
          <span>Accès membre sécurisé · My Planner</span>
        </div>
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes floatOrb1 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(35px, -30px) scale(1.08); }
          100% { transform: translate(-25px, 20px) scale(0.94); }
        }
        @keyframes floatOrb2 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-40px, 30px) scale(1.06); }
          100% { transform: translate(30px, -35px) scale(0.92); }
        }
        @keyframes floatOrb3 {
          0% { transform: translate(0px, 0px) scale(0.94); }
          50% { transform: translate(25px, 40px) scale(1.1); }
          100% { transform: translate(-35px, -20px) scale(1); }
        }
      `}</style>
    </div>
  );
}
