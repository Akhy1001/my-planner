'use client';
import Image from 'next/image';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'motion/react';
import { User } from '@supabase/supabase-js';
import { NavIconToday, NavIconAgenda, NavIconHabits, NavIconNotes, NavIconGoals } from './animate-ui/icons/nav-icons';
import { ThemeToggle } from './animate-ui/icons/theme-toggle';
import { TextReveal } from './animate-ui';

type Tab = 'today' | 'agenda' | 'habits' | 'notes' | 'goals';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  user: User;
  onSignOut: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  isPinkUser: boolean;
}

const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'today',  label: "Aujourd'hui", icon: <NavIconToday /> },
  { id: 'agenda', label: 'Agenda',       icon: <NavIconAgenda /> },
  { id: 'habits', label: 'Habitudes',    icon: <NavIconHabits /> },
  { id: 'notes',  label: 'Notes',        icon: <NavIconNotes /> },
  { id: 'goals',  label: 'Objectifs',    icon: <NavIconGoals /> },
];

export default function Sidebar({ activeTab, setActiveTab, user, onSignOut, isDark, onToggleTheme, isPinkUser }: SidebarProps) {
  const today = new Date();
  const displayName = user.email?.split('@')[0] ?? 'Utilisateur';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <aside style={{
      width: '230px',
      background: 'var(--warm-white)',
      borderRight: '1px solid var(--border)',
      transition: 'background 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      display: 'flex',
      flexDirection: 'column',
      padding: '28px 0',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '0 22px 28px', display: 'flex', alignItems: 'center', gap: '12px' }} className="animate-slide-in">
        <Image
          src="/logo.jpg"
          alt="My Planner logo"
          width={38}
          height={38}
          style={{ borderRadius: '10px', flexShrink: 0 }}
          priority
        />
        <div>
          <div className="font-display" style={{
            fontSize: '1.1rem', color: 'var(--ink)',
            fontWeight: '800', letterSpacing: '-0.03em',
          }}>
            My Planner
          </div>
          <div style={{
            fontSize: '0.65rem', color: 'var(--stone)',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '2px',
          }}>
            Digital Journal
          </div>
        </div>
      </div>

      {/* Date widget */}
      <div style={{
        margin: '0 14px 24px',
        padding: '16px',
        background: 'var(--cream)',
        borderRadius: '18px',
        border: '1px solid var(--border)',
        textAlign: 'center',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }} className="animate-slide-in">
        <TextReveal
          delay={0.06}
          className="font-display"
          style={{
            fontSize: '2.6rem', fontWeight: '700',
            color: 'var(--ink)', lineHeight: 1,
          }}
        >
          {format(today, 'd')}
        </TextReveal>
        <TextReveal
          delay={0.12}
          style={{
            fontSize: '0.82rem', color: 'var(--stone)',
            fontWeight: '500', marginTop: '4px',
          }}
        >
          {format(today, 'MMMM yyyy', { locale: fr })}
        </TextReveal>
        <TextReveal
          delay={0.18}
          style={{
            fontSize: '0.7rem', color: 'var(--stone-light)',
            letterSpacing: '0.06em', textTransform: 'capitalize', marginTop: '2px',
          }}
        >
          {format(today, 'eeee', { locale: fr })}
        </TextReveal>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 10px' }} className="stagger-children">
        {navItems.map((item, i) => {
          const active = activeTab === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              whileHover={{
                scale: 1.02,
                x: 2,
                backgroundColor: active
                  ? 'transparent'
                  : (isPinkUser ? 'rgba(212, 96, 126, 0.12)' : 'rgba(128, 128, 128, 0.08)'),
              }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '14px',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: active ? 'var(--primary-btn-fg, var(--cream))' : 'var(--stone)',
                cursor: 'pointer',
                fontSize: '0.84rem',
                fontWeight: active ? '700' : '500',
                textAlign: 'left',
                marginBottom: '3px',
                animationDelay: `${i * 0.05}s`,
                fontFamily: 'inherit',
                position: 'relative',
              }}
            >
              {active && (
                <motion.div
                  layoutId="activeNavIndicator"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '14px',
                    background: 'var(--primary-btn-bg)',
                    boxShadow: '0 2px 8px var(--primary-btn-shadow, rgba(15,23,42,0.12))',
                    zIndex: 0,
                  }}
                />
              )}

              <div style={{
                position: 'relative',
                zIndex: 1,
                fontSize: '1rem',
                color: active ? 'var(--primary-btn-fg, var(--cream))' : 'var(--stone)',
                opacity: active ? 1 : 0.6,
                transition: 'opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), color 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: active ? 'scale(1.1)' : 'scale(1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {item.icon}
              </div>
              <span style={{ position: 'relative', zIndex: 1, flex: 1, transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                {item.label}
              </span>
              {active && (
                <div style={{
                  position: 'relative',
                  zIndex: 1,
                  width: '6px', height: '6px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  marginLeft: '8px',
                  animation: 'enter 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                }} />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Theme toggle — masqué pour l'utilisateur pink */}
      {!isPinkUser && (
        <div style={{ padding: '0 10px', marginBottom: '4px' }}>
          <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
        </div>
      )}

      {/* User profile + logout */}
      <div style={{ padding: '0 14px', marginTop: 'auto' }} className="animate-slide-in">
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '16px',
        }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px',
              background: 'var(--cream)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(24, 24, 27, 0.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Avatar */}
            <div style={{
              width: '34px', height: '34px', borderRadius: '12px',
              background: isPinkUser
                ? 'linear-gradient(135deg, #F472B6 0%, #D4607E 100%)'
                : 'linear-gradient(135deg, var(--accent) 0%, var(--lavender) 100%)',
              color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: '700', flexShrink: 0,
              letterSpacing: '0.05em',
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '0.76rem', fontWeight: '600', color: 'var(--ink)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {displayName}
              </div>
              <div style={{
                fontSize: '0.62rem', color: 'var(--stone)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user.email}
              </div>
            </div>
            {/* Logout */}
            <motion.button
              onClick={onSignOut}
              title="Se déconnecter"
              whileHover={{ scale: 1.1, background: 'var(--priority-high-bg)', color: 'var(--priority-high)' }}
              whileTap={{ scale: 0.92 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--stone)', fontSize: '1.1rem', padding: '6px',
                borderRadius: '10px',
                flexShrink: 0, lineHeight: 1,
              }}
            >
              ⎋
            </motion.button>
          </div>
        </div>
      </div>
    </aside>
  );
}
