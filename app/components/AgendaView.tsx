'use client';
import AddButton from './AddButton';
import { Calendar, Zap, Trash } from './animate-ui';
import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, getDay, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEvents } from '@/hooks/useEvents';

const COLORS = ['var(--sage)', 'var(--terra)', 'var(--gold)', 'var(--lavender)'];

export default function AgendaView() {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', time: '', duration: '1h', color: COLORS[0], category: 'Personnel' });

  const { events, loading, addEvent, removeEvent } = useEvents();

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  // Pour une semaine commençant par lundi, calculer le décalage correctement
  const firstDayOfMonth = startOfMonth(currentMonth);
  const firstDayWeekday = getDay(firstDayOfMonth); // 0 = dimanche, 1 = lundi, etc.
  // Convertir pour que lundi = 0, dimanche = 6
  const firstDayOffset = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;

  const selectedEvents = events.filter(e => isSameDay(startOfDay(e.date), startOfDay(selectedDate)));

  const handleAddEvent = async () => {
    if (!newEvent.title.trim()) return;
    await addEvent({
      title: newEvent.title,
      date: startOfDay(selectedDate),
      time: newEvent.time || '09:00',
      duration: newEvent.duration,
      color: newEvent.color,
      category: newEvent.category,
    });
    setNewEvent({ title: '', time: '', duration: '1h', color: COLORS[0], category: 'Personnel' });
    setShowForm(false);
  };

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div style={{ display: 'flex', gap: '24px', padding: '32px', height: '100%', overflowY: 'auto' }}>
      {/* Calendar */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 className="font-display" style={{ fontSize: '1.8rem', color: 'var(--ink)' }}>
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </h1>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={btnStyle}>‹</button>
            <button onClick={() => {
              const today = startOfDay(new Date());
              setCurrentMonth(startOfMonth(today));
              setSelectedDate(today);
            }} style={{ ...btnStyle, fontSize: '0.76rem', padding: '6px 12px' }}>Aujourd&apos;hui</button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={btnStyle}>›</button>
          </div>
        </div>

        {/* Calendar grid */}
        <div style={{ 
          background: 'white', borderRadius: '14px', 
          border: '1px solid var(--border)',
          overflow: 'hidden',
          boxShadow: '0 1px 8px rgba(26,23,20,0.04)'
        }}>
          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
            {weekDays.map(d => (
              <div key={d} style={{ 
                padding: '12px 0', textAlign: 'center',
                fontSize: '0.72rem', color: 'var(--stone)',
                letterSpacing: '0.06em', textTransform: 'uppercase'
              }}>{d}</div>
            ))}
          </div>

          {/* Days */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} style={{ borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', minHeight: '80px' }} />
            ))}
            {days.map(day => {
              const dayEvents = events.filter(e => isSameDay(startOfDay(e.date), startOfDay(day)));
              const selected = isSameDay(day, selectedDate);
              const today = isToday(day);
              return (
                <div
                  key={day.toString()}
                  onClick={() => setSelectedDate(startOfDay(day))}
                  style={{
                    borderRight: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                    minHeight: '80px',
                    padding: '8px',
                    cursor: 'pointer',
                    background: selected ? 'rgba(122, 140, 110, 0.08)' : 'white',
                    transition: 'background 0.1s',
                  }}
                >
                  <div style={{
                    width: '26px', height: '26px',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.82rem',
                    background: today ? 'var(--terra)' : 'transparent',
                    color: today ? 'white' : selected ? 'var(--sage)' : 'var(--ink)',
                    fontWeight: today || selected ? '500' : '300',
                    marginBottom: '4px'
                  }}>
                    {format(day, 'd')}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {dayEvents.slice(0, 2).map(e => (
                      <div key={e.id} style={{
                        fontSize: '0.65rem', padding: '2px 5px',
                        borderRadius: '3px', color: 'white',
                        background: e.color,
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'
                      }}>
                        <span style={{ opacity: 0.85, marginRight: '3px' }}>{e.time}</span>
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && <div style={{ fontSize: '0.6rem', color: 'var(--stone)' }}>+{dayEvents.length - 2}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Event panel */}
      <div style={{ width: '280px', flexShrink: 0 }}>
        <div style={{ 
          display: 'flex', justifyContent: 'space-between', 
          alignItems: 'center', marginBottom: '16px' 
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {format(selectedDate, 'eeee', { locale: fr })}
            </div>
            <div className="font-display" style={{ fontSize: '1.4rem', color: 'var(--ink)' }}>
              {format(selectedDate, 'd MMMM', { locale: fr })}
            </div>
          </div>
          <AddButton onClick={() => setShowForm(!showForm)} />
        </div>

        {/* Add event form */}
        {showForm && (
          <div style={{ 
            background: 'white', borderRadius: '12px', 
            padding: '16px', marginBottom: '16px',
            border: '1px solid var(--border)'
          }}>
            <input
              value={newEvent.title}
              onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
              placeholder="Titre de l'événement"
              style={inputStyle}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <input type="time" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
              <input value={newEvent.duration} onChange={e => setNewEvent({ ...newEvent, duration: e.target.value })} placeholder="1h" style={{ ...inputStyle, width: '60px' }} />
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setNewEvent({ ...newEvent, color: c })} style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: c, cursor: 'pointer',
                  border: newEvent.color === c ? '2px solid var(--ink)' : '2px solid transparent',
                  transition: 'border 0.15s'
                }} />
              ))}
            </div>
            <button onClick={handleAddEvent} style={{
              width: '100%', marginTop: '10px', padding: '8px',
              background: 'var(--ink)', color: 'var(--cream)',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontSize: '0.82rem', fontFamily: 'inherit'
            }}>Ajouter</button>
          </div>
        )}

        {/* Events list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--stone)', fontSize: '0.85rem' }}>Chargement…</div>
          ) : selectedEvents.length === 0 ? (
            <div style={{ 
              textAlign: 'center', padding: '40px 20px',
              color: 'var(--stone)', fontSize: '0.85rem'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>○</div>
              Aucun événement
            </div>
          ) : (
            selectedEvents.map(event => (
              <div key={event.id} style={{
                background: 'white', borderRadius: '12px',
                padding: '14px 16px',
                border: '1px solid var(--border)',
                borderLeft: `4px solid ${event.color}`,
                boxShadow: '0 1px 4px rgba(26,23,20,0.04)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: '500', color: 'var(--ink)' }}>{event.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--stone)', marginTop: '4px' }}>
                      ⏱ {event.time} · {event.duration}
                    </div>
                  </div>
                  <button
                    onClick={() => removeEvent(event.id)}
                    title="Supprimer l'événement"
                    style={{
                      padding: '8px 12px', borderRadius: '12px',
                      border: '1px solid var(--border)', background: 'var(--cream)',
                      cursor: 'pointer', color: 'var(--terra)', transition: 'all 0.15s',
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      fontSize: '0.78rem', fontWeight: 600
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--terra-light)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--cream)'; }}
                  >
                    <Trash size={16} color="var(--terra)" />
                    Supprimer
                  </button>
                </div>
                <div style={{ 
                  fontSize: '0.68rem', marginTop: '10px', padding: '2px 8px',
                  borderRadius: '10px', display: 'inline-block',
                  background: 'var(--warm-white)', color: 'var(--stone)'
                }}>{event.category}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '6px 10px', background: 'white',
  border: '1px solid var(--border)', borderRadius: '8px',
  cursor: 'pointer', fontSize: '1rem', color: 'var(--ink)',
  fontFamily: 'inherit'
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px',
  border: '1px solid var(--border)', borderRadius: '7px',
  background: 'var(--warm-white)', fontSize: '0.82rem',
  color: 'var(--ink)', outline: 'none', fontFamily: 'inherit'
};
