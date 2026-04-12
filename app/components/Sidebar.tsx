'use client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { User } from '@supabase/supabase-js';

type Tab = 'today' | 'agenda' | 'habits' | 'notes' | 'goals';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  user: User;
  onSignOut: () => void;
}

const navItems: { id: Tab; label: string; icon: string }[] = [
  { id: 'today',  label: "Aujourd'hui", icon: '◈' },
  { id: 'agenda', label: 'Agenda',       icon: '◷' },
  { id: 'habits', label: 'Habitudes',    icon: '◉' },
  { id: 'notes',  label: 'Notes',        icon: '◫' },
  { id: 'goals',  label: 'Objectifs',    icon: '◎' },
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
      <div style={{ padding: '0 22px 28px' }}>
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
      }}>
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
      <nav style={{ flex: 1, padding: '0 10px' }}>
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
                background: active ? 'var(--ink)' : 'transparent',
                color: active ? 'white' : 'var(--stone)',
                cursor: 'pointer',
                fontSize: '0.84rem',
                fontWeight: active ? '600' : '400',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                textAlign: 'left',
                marginBottom: '3px',
                animationDelay: `${i * 0.05}s`,
                fontFamily: 'inherit',
              }}
            >
              <span style={{
                fontSize: '1rem',
                opacity: active ? 1 : 0.5,
                transition: 'opacity 0.15s',
              }}>
                {item.icon}
              </span>
              {item.label}
              {active && (
                <div style={{
                  marginLeft: 'auto',
                  width: '6px', height: '6px',
                  borderRadius: '50%',
                  background: 'var(--terra)',
                }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* User profile + logout */}
      <div style={{ padding: '0 14px', marginTop: 'auto' }}>
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '16px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px',
            background: 'var(--cream)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
          }}>
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
                borderRadius: '8px', transition: 'all 0.15s',
                flexShrink: 0, lineHeight: 1,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--terra)';
                e.currentTarget.style.background = 'rgba(192,99,74,0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--stone)';
                e.currentTarget.style.background = 'none';
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
