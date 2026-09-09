'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
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

  // État de l'écran de chargement simulé
  const [isSuccessLoading, setIsSuccessLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Authentification validée…');

  const startLoadingSimulation = (demo = false) => {
    setIsDemoMode(demo);
    setProgress(0);
    setStatusText('Authentification validée…');
    setIsSuccessLoading(true);
  };

  useEffect(() => {
    if (!isSuccessLoading) return;

    let startTime: number | null = null;
    const duration = 2200; // 2.2s de fluidité continue 60fps
    let animationFrameId: number;
    let finishTimeoutId: NodeJS.Timeout;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const t = Math.min(elapsed / duration, 1);

      // Courbe d'accélération/décélération ultra-fluide (Ease-in-out cubique)
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const current = Math.min(eased * 100, 100);

      setProgress(current);

      if (current < 28) {
        setStatusText('Authentification validée…');
      } else if (current < 65) {
        setStatusText('Synchronisation de votre profil…');
      } else if (current < 92) {
        setStatusText('Chargement de vos notes & tâches…');
      } else {
        setStatusText('Bienvenue sur My Planner !');
      }

      if (t < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        finishTimeoutId = setTimeout(() => {
          if (isDemoMode) {
            setIsSuccessLoading(false);
            setProgress(0);
          } else {
            router.push('/');
          }
        }, 450);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(finishTimeoutId);
    };
  }, [isSuccessLoading, isDemoMode, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    if (error) {
      setError('Email ou mot de passe incorrect.');
      setLoading(false);
    } else {
      setLoading(false);
      startLoadingSimulation(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 50% 15%, rgba(15, 23, 42, 0.035) 0%, transparent 60%), var(--cream, #FAFAFA)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Nunito', var(--font-geist-sans), system-ui, sans-serif",
        position: 'relative',
        overflow: 'hidden',
        padding: '24px',
      }}
    >
      {/* ── Subtle Monochrome Ambient Glows (Profil Anas) ── */}
      <div
        style={{
          position: 'absolute',
          top: '5%',
          left: '12%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(15, 23, 42, 0.04) 0%, rgba(15, 23, 42, 0.01) 50%, transparent 70%)',
          filter: 'blur(55px)',
          pointerEvents: 'none',
          animation: 'floatOrb1 16s ease-in-out infinite alternate',
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
          background: 'radial-gradient(circle, rgba(15, 23, 42, 0.035) 0%, rgba(15, 23, 42, 0.01) 50%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          animation: 'floatOrb2 18s ease-in-out infinite alternate',
        }}
      />

      {/* ── Main Monochrome Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: '430px',
          background: '#FFFFFF',
          borderRadius: '22px',
          padding: '42px 36px 36px',
          boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04)',
          border: '1px solid var(--border, #E2E8F0)',
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Subtle Top Monochrome Accent Line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #0F172A 0%, #475569 50%, #0F172A 100%)',
          }}
        />

        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          {/* Logo Badge */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              overflow: 'hidden',
              border: '1px solid var(--border, #E2E8F0)',
              boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              background: '#FFFFFF',
            }}
          >
            <Image
              src="/logo.jpg"
              alt="My Planner logo"
              width={64}
              height={64}
              style={{ objectFit: 'contain', width: '100%', height: '100%', display: 'block' }}
              priority
            />
          </motion.div>

          {/* Sparkle badge in B&W */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: 'rgba(15, 23, 42, 0.05)',
              border: '1px solid rgba(15, 23, 42, 0.08)',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#0F172A',
              marginBottom: '10px',
              letterSpacing: '0.02em',
            }}
          >
            <Sparkles size={12} style={{ color: '#0F172A' }} />
            <span>Digital Journal & Todos</span>
          </div>

          <h1
            className="font-display"
            style={{
              fontSize: '1.95rem',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.03em',
              marginBottom: '4px',
            }}
          >
            My Planner
          </h1>
          <p
            style={{
              fontSize: '0.86rem',
              color: 'var(--stone, #64748B)',
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
                color: focusedField === 'email' ? '#0F172A' : 'var(--stone, #64748B)',
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
                  color: focusedField === 'email' ? '#0F172A' : 'var(--stone, #64748B)',
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
                  border: focusedField === 'email' ? '1.5px solid #0F172A' : '1px solid var(--border, #E2E8F0)',
                  borderRadius: '12px',
                  background: focusedField === 'email' ? '#FFFFFF' : 'var(--cream, #FAFAFA)',
                  fontSize: '0.88rem',
                  color: '#0F172A',
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                  boxShadow: focusedField === 'email' ? '0 0 0 4px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(15, 23, 42, 0.04)' : 'none',
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
                color: focusedField === 'password' ? '#0F172A' : 'var(--stone, #64748B)',
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
                  color: focusedField === 'password' ? '#0F172A' : 'var(--stone, #64748B)',
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
                  border: focusedField === 'password' ? '1.5px solid #0F172A' : '1px solid var(--border, #E2E8F0)',
                  borderRadius: '12px',
                  background: focusedField === 'password' ? '#FFFFFF' : 'var(--cream, #FAFAFA)',
                  fontSize: '0.88rem',
                  color: '#0F172A',
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                  boxShadow: focusedField === 'password' ? '0 0 0 4px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(15, 23, 42, 0.04)' : 'none',
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
                  color: showPassword ? '#0F172A' : 'var(--stone, #64748B)',
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

          {/* Submit button - Noir & Blanc Signature Profil Anas */}
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
                ? 'var(--stone-light, #CBD5E1)'
                : 'radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.18) 0%, transparent 70%), #0F172A',
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
                : '0 8px 24px -4px rgba(15, 23, 42, 0.28), 0 2px 6px rgba(15, 23, 42, 0.12)',
              transition: 'background 0.22s ease, box-shadow 0.22s ease',
            }}
            onMouseEnter={e => {
              if (!loading) e.currentTarget.style.background = 'radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.25) 0%, transparent 70%), #1E293B';
            }}
            onMouseLeave={e => {
              if (!loading) e.currentTarget.style.background = 'radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.18) 0%, transparent 70%), #0F172A';
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

        {/* Footer info & Test trigger button */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '26px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontSize: '0.74rem',
              color: 'var(--stone, #64748B)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ color: '#0F172A' }}>✦</span>
            <span>Accès membre sécurisé · My Planner</span>
          </div>

          <button
            type="button"
            onClick={() => startLoadingSimulation(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.72rem',
              color: '#0F172A',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '8px',
              opacity: 0.65,
              transition: 'opacity 0.2s ease, background 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.background = 'rgba(15, 23, 42, 0.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = '0.65';
              e.currentTarget.style.background = 'none';
            }}
          >
            <span>⚡ Tester l'écran de chargement</span>
          </button>
        </div>
      </motion.div>

      {/* ── Écran de chargement immersif post-connexion (Monochrome & Effets) ── */}
      <AnimatePresence>
        {isSuccessLoading && (
          <motion.div
            key="success-loading-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'var(--cream, #FAFAFA)',
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
                background: 'radial-gradient(circle, rgba(15, 23, 42, 0.05) 0%, transparent 65%)',
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
              {/* ── Logo qui tourne avec effet d'orbite et pulsation ── */}
              <div
                style={{
                  position: 'relative',
                  width: '116px',
                  height: '116px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '28px',
                }}
              >
                {/* Anneau d'orbite en contre-rotation avec satellite */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    border: '1.5px dashed rgba(15, 23, 42, 0.22)',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Point satellite orbital */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      left: 'calc(50% - 4px)',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#0F172A',
                      boxShadow: '0 0 8px rgba(15, 23, 42, 0.4)',
                    }}
                  />
                </motion.div>

                {/* Badge du logo avec rotation 360° et pulsation de taille */}
                <motion.div
                  animate={{
                    rotate: 360,
                    scale: [1, 1.07, 1],
                  }}
                  transition={{
                    rotate: { repeat: Infinity, duration: 3.2, ease: 'linear' },
                    scale: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' },
                  }}
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: '20px',
                    background: '#FFFFFF',
                    border: '1px solid var(--border, #E2E8F0)',
                    boxShadow: '0 14px 34px -6px rgba(15, 23, 42, 0.16), 0 2px 8px rgba(15, 23, 42, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    src="/logo.jpg"
                    alt="My Planner logo"
                    width={74}
                    height={74}
                    style={{ objectFit: 'contain', width: '100%', height: '100%', display: 'block' }}
                    priority
                  />
                </motion.div>
              </div>

              {/* Titre & Sous-titre */}
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
                    color: '#0F172A',
                    letterSpacing: '-0.03em',
                    marginBottom: '4px',
                  }}
                >
                  My Planner
                </div>
                <div
                  style={{
                    fontSize: '0.86rem',
                    color: 'var(--stone, #64748B)',
                    fontWeight: 600,
                    minHeight: '20px',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {statusText}
                </div>
              </motion.div>

              {/* ── Barre de chargement avec effet de balayage lumineux (Shimmer) ── */}
              <div style={{ width: '270px' }}>
                {/* Track */}
                <div
                  style={{
                    width: '100%',
                    height: '7px',
                    background: 'rgba(15, 23, 42, 0.08)',
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
                      width: `${progress}%`,
                      background: 'linear-gradient(90deg, #0F172A 0%, #334155 35%, #FFFFFF 50%, #334155 65%, #0F172A 100%)',
                      backgroundSize: '240% 100%',
                      animation: 'barShimmer 1.4s infinite linear',
                      borderRadius: '999px',
                      position: 'relative',
                      boxShadow: '0 0 10px rgba(15, 23, 42, 0.35)',
                      willChange: 'width',
                    }}
                  />
                </div>

                {/* Pourcentage et détails */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '10px',
                    fontSize: '0.75rem',
                    color: 'var(--stone, #64748B)',
                    fontWeight: 600,
                  }}
                >
                  <span>Initialisation</span>
                  <span style={{ color: '#0F172A', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes barShimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        @keyframes floatOrb1 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(30px, -25px) scale(1.06); }
          100% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes floatOrb2 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-30px, 25px) scale(1.05); }
          100% { transform: translate(25px, -25px) scale(0.94); }
        }
      `}</style>
    </div>
  );
}
