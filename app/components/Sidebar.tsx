'use client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { User } from '@supabase/supabase-js';
import { NavIconToday, NavIconAgenda, NavIconHabits, NavIconNotes, NavIconGoals } from './animate-ui/icons/nav-icons';

type Tab = 'today' | 'agenda' | 'habits' | 'notes' | 'goals';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  user: User;
  onSignOut: () => void;
}

const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'today',  label: "Aujourd'hui", icon: <NavIconToday /> },
  { id: 'agenda', label: 'Agenda',       icon: <NavIconAgenda /> },
  { id: 'habits', label: 'Habitudes',    icon: <NavIconHabits /> },
  { id: 'notes',  label: 'Notes',        icon: <NavIconNotes /> },
  { id: 'goals',  label: 'Objectifs',    icon: <NavIconGoals /> },
];

export default function Sidebar({ activeTab, setActiveTab, user, onSignOut }: SidebarProps) {
  const today = new Date();
  const displayName = user.email?.split('@')[0] ?? 'Utilisateur';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <aside style={{
      width: '230px',
      background: 'white',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '28px 0',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '0 22px 28px' }} className="animate-slide-in">
        <div className="font-display" style={{
          fontSize: '1.35rem', color: 'var(--ink)',
          fontWeight: '700', letterSpacing: '-0.03em',
        }}>
          Mon Planner
        </div>
        <div style={{
          fontSize: '0.68rem', color: 'var(--stone)',
          letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '3px',
        }}>
          Digital Journal
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
        <div className="font-display" style={{
          fontSize: '2.6rem', fontWeight: '700',
          color: 'var(--ink)', lineHeight: 1,
        }}>
          {format(today, 'd')}
        </div>
        <div style={{
          fontSize: '0.82rem', color: 'var(--stone)',
          fontWeight: '500', marginTop: '4px',
        }}>
          {format(today, 'MMMM yyyy', { locale: fr })}
        </div>
        <div style={{
          fontSize: '0.7rem', color: 'var(--stone-light)',
          letterSpacing: '0.06em', textTransform: 'capitalize', marginTop: '2px',
        }}>
          {format(today, 'eeee', { locale: fr })}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 10px' }} className="stagger-children">
        {navItems.map((item, i) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '14px',
                border: 'none',
                background: active 
                  ? 'var(--ink)' 
                  : 'transparent',
                color: active ? 'white' : 'var(--stone)',
                cursor: 'pointer',
                fontSize: '0.84rem',
                fontWeight: active ? '600' : '400',
                transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                textAlign: 'left',
                marginBottom: '3px',
                animationDelay: `${i * 0.05}s`,
                fontFamily: 'inherit',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(24, 24, 27, 0.05)';
                  e.currentTarget.style.color = 'var(--ink-light)';
                  e.currentTarget.style.transform = 'translateX(2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--stone)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }
              }}
            >
              {/* Glow effect background on active */}
              {active && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.2) 0%, transparent 70%)',
                  pointerEvents: 'none',
                  opacity: 0,
                  animation: 'enter 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                }} />
              )}
              
              <div style={{
                fontSize: '1rem',
                color: active ? 'white' : 'var(--stone)',
                opacity: active ? 1 : 0.5,
                transition: 'opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), color 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: active ? 'scale(1.15)' : 'scale(1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {item.icon}
              </div>
              <span style={{ flex: 1, transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                {item.label}
              </span>
              {active && (
                <div style={{
                  width: '6px', height: '6px',
                  borderRadius: '50%',
                  background: 'var(--terra)',
                  marginLeft: '8px',
                  animation: 'enter 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                }} />
              )}
            </button>
          );
        })}
      </nav>

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
              background: 'linear-gradient(135deg, var(--sage) 0%, var(--lavender) 100%)',
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
            <button
              onClick={onSignOut}
              title="Se déconnecter"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--stone)', fontSize: '1.1rem', padding: '4px',
                borderRadius: '8px', transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                flexShrink: 0, lineHeight: 1,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--terra)';
                e.currentTarget.style.background = 'rgba(192,99,74,0.1)';
                e.currentTarget.style.transform = 'scale(1.12)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--stone)';
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ⎋
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
