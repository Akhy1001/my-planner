'use client';
import AddButton from './AddButton';
import { Trash } from './animate-ui';
import { useState } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isToday, addMonths, subMonths, getDay, startOfDay,
  startOfWeek, endOfWeek, addWeeks, subWeeks,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Pencil } from 'lucide-react';
import { useEvents, Event, RecurrenceType } from '@/hooks/useEvents';
import { useMenstrualCycle, computeCycleDays, daysUntilNextPeriod, CycleDay, MenstrualCycle } from '@/hooks/useMenstrualCycle';
import { useAuth } from '@/hooks/useAuth';

const CYCLE_ALLOWED_EMAIL = 'rstrpn05@gmail.com';

const COLORS = ['var(--sage)', 'var(--terra)', 'var(--gold)', 'var(--lavender)'];

const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  none: 'Aucune',
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuel',
};

const RECURRENCE_BADGE: Record<RecurrenceType, string> = {
  none: '',
  daily: '↻ Quotidien',
  weekly: '↻ Hebdo',
  monthly: '↻ Mensuel',
};

const WEEK_OPTS = { weekStartsOn: 1 as const };
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface EventFormState {
  title: string;
  time: string;
  duration: string;
  color: string;
  category: string;
  recurrence: RecurrenceType;
}

const defaultForm: EventFormState = {
  title: '',
  time: '',
  duration: '1h',
  color: COLORS[0],
  category: 'Personnel',
  recurrence: 'none',
};

export default function AgendaView() {
  const [view, setView] = useState<'month' | 'week'>('month');
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), WEEK_OPTS));
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<EventFormState>(defaultForm);
  const [editingBaseId, setEditingBaseId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { events, loading, addEvent, updateEvent, removeEvent } = useEvents();
  const { user } = useAuth();
  const isCycleUser = user?.email === CYCLE_ALLOWED_EMAIL;
  const { cycle, saveCycle, deleteCycle } = useMenstrualCycle();

  const [showCycleForm, setShowCycleForm] = useState(false);
  const [cycleForm, setCycleForm] = useState<{ startDate: string; cycleLength: string; periodDuration: string }>({
    startDate: '',
    cycleLength: '28',
    periodDuration: '5',
  });

  const openCycleForm = () => {
    setCycleForm({
      startDate: cycle ? format(cycle.startDate, 'yyyy-MM-dd') : '',
      cycleLength: String(cycle?.cycleLength ?? 28),
      periodDuration: String(cycle?.periodDuration ?? 5),
    });
    setShowCycleForm(true);
  };

  const handleSaveCycle = async () => {
    if (!cycleForm.startDate) return;
    await saveCycle({
      startDate: startOfDay(new Date(cycleForm.startDate)),
      cycleLength: parseInt(cycleForm.cycleLength, 10) || 28,
      periodDuration: parseInt(cycleForm.periodDuration, 10) || 5,
    });
    setShowCycleForm(false);
  };

  // Calcul des jours de cycle uniquement pour le compte autorisé
  const cycleRangeStart = startOfMonth(addMonths(currentMonth, -1));
  const cycleRangeEnd = endOfMonth(addMonths(currentMonth, 1));
  const cycleDays: CycleDay[] = isCycleUser && cycle
    ? computeCycleDays(cycle, cycleRangeStart, cycleRangeEnd)
    : [];

  // Month view data
  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const firstDayOffset = (() => {
    const d = getDay(startOfMonth(currentMonth));
    return d === 0 ? 6 : d - 1;
  })();

  // Week view data
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: endOfWeek(currentWeekStart, WEEK_OPTS) });

  const selectedEvents = events.filter(e => isSameDay(startOfDay(e.date), startOfDay(selectedDate)));

  const goToToday = () => {
    const today = startOfDay(new Date());
    setCurrentMonth(startOfMonth(today));
    setCurrentWeekStart(startOfWeek(today, WEEK_OPTS));
    setSelectedDate(today);
  };

  const goPrev = () => {
    if (view === 'month') setCurrentMonth(subMonths(currentMonth, 1));
    else setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const goNext = () => {
    if (view === 'month') setCurrentMonth(addMonths(currentMonth, 1));
    else setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const openAddForm = () => {
    setEditingBaseId(null);
    setFormData(defaultForm);
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (event: Event) => {
    const baseId = event.baseId ?? event.id;
    setEditingBaseId(baseId);
    setFormData({
      title: event.title,
      time: event.time,
      duration: event.duration,
      color: event.color,
      category: event.category,
      recurrence: event.recurrence,
    });
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingBaseId(null);
    setFormData(defaultForm);
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setFormError('Le titre est obligatoire.');
      return;
    }
    setFormError(null);

    if (editingBaseId) {
      await updateEvent(editingBaseId, {
        title: formData.title,
        time: formData.time || '09:00',
        duration: formData.duration,
        color: formData.color,
        category: formData.category,
        recurrence: formData.recurrence,
      });
    } else {
      await addEvent({
        title: formData.title,
        date: startOfDay(selectedDate),
        time: formData.time || '09:00',
        duration: formData.duration,
        color: formData.color,
        category: formData.category,
        recurrence: formData.recurrence,
      });
    }
    closeForm();
  };

  const handleDelete = (event: Event) => {
    const baseId = event.baseId ?? event.id;
    removeEvent(baseId);
  };

  const weekDayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Title for the header
  const headerTitle = view === 'month'
    ? format(currentMonth, 'MMMM yyyy', { locale: fr })
    : `${format(currentWeekStart, 'd MMM', { locale: fr })} – ${format(endOfWeek(currentWeekStart, WEEK_OPTS), 'd MMM yyyy', { locale: fr })}`;

  return (
    <div style={{ display: 'flex', gap: '24px', padding: '32px', height: '100%', overflowY: 'auto' }}>
      {/* Calendar */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
          <h1 className="font-display" style={{ fontSize: '1.8rem', color: 'var(--ink)', flexShrink: 0 }}>
            {headerTitle}
          </h1>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {/* View toggle */}
            <div style={{
              display: 'flex',
              background: 'var(--warm-white)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '3px',
              gap: '2px',
            }}>
              {(['month', 'week'] as const).map(v => (
                <motion.button
                  key={v}
                  onClick={() => setView(v)}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    position: 'relative',
                    padding: '5px 14px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.76rem',
                    fontFamily: 'inherit',
                    background: 'transparent',
                    color: view === v ? 'var(--cream)' : 'var(--stone)',
                    fontWeight: view === v ? 500 : 400,
                    borderRadius: '7px',
                    zIndex: 1,
                    transition: 'color 150ms cubic-bezier(0.23, 1, 0.32, 1)',
                  }}
                >
                  {view === v && (
                    <motion.div
                      layoutId="view-toggle-pill"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'var(--ink)',
                        borderRadius: '7px',
                        zIndex: -1,
                      }}
                      transition={{ type: 'spring', duration: 0.3, bounce: 0.15 }}
                    />
                  )}
                  {v === 'month' ? 'Mois' : 'Semaine'}
                </motion.button>
              ))}
            </div>
            {/* Navigation */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={goPrev} style={btnStyle}>‹</button>
              <button onClick={goToToday} style={{ ...btnStyle, fontSize: '0.76rem', padding: '6px 12px' }}>Aujourd&apos;hui</button>
              <button onClick={goNext} style={btnStyle}>›</button>
            </div>
          </div>
        </div>

        {view === 'month' ? (
          <MonthGrid
            days={days}
            firstDayOffset={firstDayOffset}
            weekDayLabels={weekDayLabels}
            events={events}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            cycleDays={cycleDays}
          />
        ) : (
          <WeekGrid
            weekDays={weekDays}
            events={events}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            cycleDays={cycleDays}
          />
        )}
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
          <AddButton onClick={openAddForm} />
        </div>

        {/* Add / Edit form */}
        {showForm && (
          <div style={{
            background: 'var(--warm-white)', borderRadius: '12px',
            padding: '16px', marginBottom: '16px',
            border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--stone)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {editingBaseId ? 'Modifier l\'événement' : 'Nouvel événement'}
            </div>

            <input
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Titre de l'événement"
              style={inputStyle}
            />

            {formError && (
              <div style={{ fontSize: '0.75rem', color: 'var(--terra)', marginTop: '6px' }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <input
                type="time"
                value={formData.time}
                onChange={e => setFormData({ ...formData, time: e.target.value })}
                style={{ ...inputStyle, flex: 1 }}
              />
              <input
                value={formData.duration}
                onChange={e => setFormData({ ...formData, duration: e.target.value })}
                placeholder="1h"
                style={{ ...inputStyle, width: '60px' }}
              />
            </div>

            {/* Recurrence selector */}
            <select
              value={formData.recurrence}
              onChange={e => setFormData({ ...formData, recurrence: e.target.value as RecurrenceType })}
              style={{ ...inputStyle, marginTop: '8px', cursor: 'pointer' }}
            >
              {(Object.keys(RECURRENCE_LABELS) as RecurrenceType[]).map(r => (
                <option key={r} value={r}>{RECURRENCE_LABELS[r]}</option>
              ))}
            </select>

            {editingBaseId && formData.recurrence !== 'none' && (
              <div style={{ fontSize: '0.72rem', color: 'var(--stone)', marginTop: '6px', fontStyle: 'italic' }}>
                La modification s&apos;applique à toutes les occurrences.
              </div>
            )}

            {/* Color picker */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setFormData({ ...formData, color: c })} style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: c, cursor: 'pointer',
                  border: formData.color === c ? '2px solid var(--ink)' : '2px solid transparent',
                  transition: 'border 0.15s'
                }} />
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button onClick={handleSubmit} style={{
                flex: 1, padding: '8px',
                background: 'var(--ink)', color: 'var(--cream)',
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontSize: '0.82rem', fontFamily: 'inherit'
              }}>
                {editingBaseId ? 'Enregistrer' : 'Ajouter'}
              </button>
              <button onClick={closeForm} style={{
                padding: '8px 12px',
                background: 'transparent', color: 'var(--stone)',
                border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer',
                fontSize: '0.82rem', fontFamily: 'inherit'
              }}>
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Cycle menstruel — visible uniquement pour rstrpn05@gmail.com */}
        {isCycleUser && <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          style={{
            background: 'var(--warm-white)', borderRadius: '12px',
            padding: '14px 16px', marginBottom: '16px',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Cycle
            </span>
            {!showCycleForm && (
              <motion.button
                onClick={openCycleForm}
                whileHover={{ background: 'var(--border)' }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontSize: '0.72rem', color: 'var(--stone)', padding: '3px 8px',
                  borderRadius: '6px', fontFamily: 'inherit',
                }}
              >
                {cycle ? 'Modifier' : 'Configurer'}
              </motion.button>
            )}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {showCycleForm ? (
              <motion.div
                key="cycle-form"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
              >
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--stone)', display: 'block', marginBottom: '2px' }}>
                    Début du dernier cycle
                  </label>
                  <input
                    type="date"
                    value={cycleForm.startDate}
                    onChange={e => setCycleForm(f => ({ ...f, startDate: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--stone)', display: 'block', marginBottom: '2px' }}>
                      Durée cycle (j)
                    </label>
                    <input
                      type="number"
                      min={20}
                      max={45}
                      value={cycleForm.cycleLength}
                      onChange={e => setCycleForm(f => ({ ...f, cycleLength: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--stone)', display: 'block', marginBottom: '2px' }}>
                      Règles (j)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={cycleForm.periodDuration}
                      onChange={e => setCycleForm(f => ({ ...f, periodDuration: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <motion.button
                    onClick={handleSaveCycle}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
                    style={{
                      flex: 1, padding: '7px',
                      background: 'var(--ink)', color: 'var(--cream)',
                      border: 'none', borderRadius: '7px', cursor: 'pointer',
                      fontSize: '0.78rem', fontFamily: 'inherit',
                    }}
                  >
                    Enregistrer
                  </motion.button>
                  <motion.button
                    onClick={() => setShowCycleForm(false)}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
                    style={{
                      padding: '7px 10px',
                      background: 'transparent', color: 'var(--stone)',
                      border: '1px solid var(--border)', borderRadius: '7px', cursor: 'pointer',
                      fontSize: '0.78rem', fontFamily: 'inherit',
                    }}
                  >
                    Annuler
                  </motion.button>
                  {cycle && (
                    <motion.button
                      onClick={async () => { await deleteCycle(); setShowCycleForm(false); }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
                      style={{
                        padding: '7px 10px',
                        background: 'transparent', color: 'var(--terra)',
                        border: '1px solid var(--border)', borderRadius: '7px', cursor: 'pointer',
                        fontSize: '0.78rem', fontFamily: 'inherit',
                      }}
                    >
                      Supprimer
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ) : cycle ? (
              <motion.div
                key="cycle-summary"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
              >
                <CycleSummary cycle={cycle} />
              </motion.div>
            ) : (
              <motion.div
                key="cycle-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '10px 0 4px' }}
              >
                <div style={{ fontSize: '1.4rem', lineHeight: 1 }}>🩸</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--stone)', textAlign: 'center', lineHeight: 1.4 }}>
                  Suis ton cycle directement<br />dans l&apos;agenda
                </div>
                <motion.button
                  onClick={openCycleForm}
                  whileHover={{ background: 'var(--ink)', color: 'var(--cream)' }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                  style={{
                    padding: '6px 14px', marginTop: '2px',
                    background: 'transparent', color: 'var(--ink)',
                    border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer',
                    fontSize: '0.76rem', fontFamily: 'inherit',
                  }}
                >
                  Configurer mon cycle
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>}

        {/* Events list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--stone)', fontSize: '0.85rem' }}>Chargement…</div>
          ) : selectedEvents.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              style={{
                textAlign: 'center', padding: '40px 20px',
                color: 'var(--stone)', fontSize: '0.85rem'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>○</div>
              Aucun événement
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {selectedEvents.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
                  transition={{
                    duration: 0.22,
                    delay: i * 0.05,
                    ease: [0.23, 1, 0.32, 1],
                  }}
                  style={{
                    background: 'var(--warm-white)', borderRadius: '12px',
                    padding: '14px 16px',
                    border: '1px solid var(--border)',
                    borderLeft: `4px solid ${event.color}`,
                    boxShadow: '0 1px 4px rgba(26,23,20,0.04)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: '500', color: 'var(--ink)' }}>{event.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--stone)', marginTop: '4px' }}>
                        ⏱ {event.time} · {event.duration}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <motion.button
                        onClick={() => openEditForm(event)}
                        title="Modifier l'événement"
                        whileTap={{ scale: 0.93 }}
                        whileHover={{ background: 'var(--warm-white)' }}
                        transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                        style={{
                          padding: '7px 10px', borderRadius: '10px',
                          border: '1px solid var(--border)', background: 'var(--cream)',
                          cursor: 'pointer', color: 'var(--ink)',
                          display: 'inline-flex', alignItems: 'center',
                        }}
                      >
                        <Pencil size={14} />
                      </motion.button>
                      <motion.button
                        onClick={() => handleDelete(event)}
                        title="Supprimer l'événement"
                        whileTap={{ scale: 0.93 }}
                        whileHover={{ background: 'var(--terra-light)' }}
                        transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                        style={{
                          padding: '7px 10px', borderRadius: '10px',
                          border: '1px solid var(--border)', background: 'var(--cream)',
                          cursor: 'pointer', color: 'var(--terra)',
                          display: 'inline-flex', alignItems: 'center',
                        }}
                      >
                        <Trash size={14} color="var(--terra)" />
                      </motion.button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                    <div style={{
                      fontSize: '0.68rem', padding: '2px 8px',
                      borderRadius: '10px',
                      background: 'var(--warm-white)', color: 'var(--stone)'
                    }}>{event.category}</div>
                    {event.recurrence !== 'none' && (
                      <div style={{
                        fontSize: '0.68rem', padding: '2px 8px',
                        borderRadius: '10px',
                        background: event.color + '22', color: 'var(--stone)'
                      }}>{RECURRENCE_BADGE[event.recurrence]}</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Month grid ───────────────────────────────────────────────────────────────

function MonthGrid({
  days, firstDayOffset, weekDayLabels, events, selectedDate, onSelectDate, cycleDays,
}: {
  days: Date[];
  firstDayOffset: number;
  weekDayLabels: string[];
  events: Event[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  cycleDays: CycleDay[];
}) {
  return (
    <div style={{
      background: 'var(--warm-white)', borderRadius: '14px',
      border: '1px solid var(--border)',
      overflow: 'hidden',
      boxShadow: '0 1px 8px rgba(26,23,20,0.04)'
    }}>
      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
        {weekDayLabels.map(d => (
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
          const cycleDay = cycleDays.find(cd => isSameDay(startOfDay(cd.date), startOfDay(day)));
          const cycleBg = cycleDay?.type === 'period' ? 'rgba(192, 99, 74, 0.08)'
            : cycleDay?.type === 'predicted-period' ? 'rgba(192, 99, 74, 0.05)'
            : cycleDay?.type === 'fertile' ? 'rgba(107, 143, 113, 0.08)'
            : cycleDay?.type === 'cycle' ? 'rgba(26, 23, 20, 0.025)'
            : undefined;
          return (
            <div
              key={day.toString()}
              onClick={() => onSelectDate(startOfDay(day))}
              style={{
                borderRight: '1px solid var(--border)',
                borderBottom: '1px solid var(--border)',
                minHeight: '80px',
                padding: '8px',
                cursor: 'pointer',
                background: selected ? 'rgba(122, 140, 110, 0.12)' : cycleBg ?? 'transparent',
                transition: 'background 0.1s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <div style={{
                  width: '26px', height: '26px',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.82rem',
                  background: today ? 'var(--terra)' : 'transparent',
                  color: today ? 'white' : selected ? 'var(--sage)' : 'var(--ink)',
                  fontWeight: today || selected ? '500' : '300',
                }}>
                  {format(day, 'd')}
                </div>
                {cycleDay && cycleDay.type !== 'cycle' && (
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                    background: cycleDay.type === 'period' ? 'var(--terra)'
                      : cycleDay.type === 'predicted-period' ? 'rgba(192,99,74,0.4)'
                      : cycleDay.type === 'fertile' ? 'var(--sage)'
                      : 'transparent',
                  }} />
                )}
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
                    {e.recurrence !== 'none' && <span style={{ opacity: 0.75, marginRight: '2px' }}>↻</span>}
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
  );
}

// ─── Week grid ────────────────────────────────────────────────────────────────

const HOUR_HEIGHT = 52; // px per hour row

function WeekGrid({
  weekDays, events, selectedDate, onSelectDate, cycleDays,
}: {
  weekDays: Date[];
  events: Event[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  cycleDays: CycleDay[];
}) {
  return (
    <div style={{
      background: 'var(--warm-white)', borderRadius: '14px',
      border: '1px solid var(--border)',
      overflow: 'hidden',
      boxShadow: '0 1px 8px rgba(26,23,20,0.04)',
    }}>
      {/* Day headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '48px repeat(7, 1fr)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 2,
        background: 'var(--warm-white)',
      }}>
        <div style={{ borderRight: '1px solid var(--border)' }} />
        {weekDays.map(day => {
          const selected = isSameDay(day, selectedDate);
          const today = isToday(day);
          const cycleDay = cycleDays.find(cd => isSameDay(startOfDay(cd.date), startOfDay(day)));
          const cycleBg = cycleDay?.type === 'period' ? 'rgba(192, 99, 74, 0.08)'
            : cycleDay?.type === 'predicted-period' ? 'rgba(192, 99, 74, 0.05)'
            : cycleDay?.type === 'fertile' ? 'rgba(107, 143, 113, 0.08)'
            : cycleDay?.type === 'cycle' ? 'rgba(26, 23, 20, 0.025)'
            : undefined;
          return (
            <div
              key={day.toString()}
              onClick={() => onSelectDate(startOfDay(day))}
              style={{
                padding: '10px 4px',
                textAlign: 'center',
                cursor: 'pointer',
                borderRight: '1px solid var(--border)',
                background: selected ? 'rgba(122, 140, 110, 0.08)' : cycleBg ?? 'transparent',
                transition: 'background 0.1s',
              }}
            >
              <div style={{
                fontSize: '0.68rem', color: 'var(--stone)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {format(day, 'EEE', { locale: fr })}
              </div>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem', margin: '2px auto 0',
                background: today ? 'var(--terra)' : 'transparent',
                color: today ? 'white' : selected ? 'var(--sage)' : 'var(--ink)',
                fontWeight: today || selected ? 500 : 300,
              }}>
                {format(day, 'd')}
              </div>
              {cycleDay && cycleDay.type !== 'cycle' && (
                <div style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  margin: '2px auto 0', flexShrink: 0,
                  background: cycleDay.type === 'period' ? 'var(--terra)'
                    : cycleDay.type === 'predicted-period' ? 'rgba(192,99,74,0.4)'
                    : 'var(--sage)',
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div style={{ overflowY: 'auto', maxHeight: '580px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '48px repeat(7, 1fr)' }}>
          {/* Hour labels column + rows */}
          {HOURS.map(hour => (
            <React.Fragment key={hour}>
              {/* Hour label */}
              <div
                style={{
                  height: `${HOUR_HEIGHT}px`,
                  borderRight: '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
                  paddingRight: '6px', paddingTop: '4px',
                  fontSize: '0.65rem', color: 'var(--stone)',
                  userSelect: 'none',
                }}
              >
                {String(hour).padStart(2, '0')}h
              </div>

              {/* Day cells for this hour */}
              {weekDays.map(day => {
                const dayEvents = events.filter(e =>
                  isSameDay(startOfDay(e.date), startOfDay(day)) &&
                  parseHour(e.time) === hour
                );
                const selected = isSameDay(day, selectedDate);
                return (
                  <div
                    key={`${day}-${hour}`}
                    onClick={() => onSelectDate(startOfDay(day))}
                    style={{
                      height: `${HOUR_HEIGHT}px`,
                      borderRight: '1px solid var(--border)',
                      borderBottom: '1px solid var(--border)',
                      padding: '2px 3px',
                      cursor: 'pointer',
                      background: selected ? 'rgba(122, 140, 110, 0.05)' : 'transparent',
                      transition: 'background 0.1s',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {dayEvents.map(e => (
                      <div
                        key={e.id}
                        title={`${e.time} – ${e.title}`}
                        style={{
                          background: e.color,
                          color: 'white',
                          borderRadius: '4px',
                          padding: '2px 5px',
                          fontSize: '0.65rem',
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          marginBottom: '1px',
                        }}
                      >
                        <span style={{ opacity: 0.85, marginRight: '3px' }}>{e.time}</span>
                        {e.recurrence !== 'none' && <span style={{ opacity: 0.75, marginRight: '2px' }}>↻</span>}
                        {e.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Cycle summary ────────────────────────────────────────────────────────────

function CycleSummary({ cycle }: { cycle: MenstrualCycle }) {
  const days = daysUntilNextPeriod(cycle);

  const badges = [
    { label: `🩸 Règles · ${cycle.periodDuration}j`, bg: 'rgba(192,99,74,0.12)', color: 'var(--terra)' },
    { label: `🌿 Cycle · ${cycle.cycleLength}j`, bg: 'rgba(107,143,113,0.12)', color: 'var(--sage)' },
  ];

  return (
    <>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {badges.map((badge, i) => (
          <motion.span
            key={badge.label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.06, ease: [0.23, 1, 0.32, 1] }}
            style={{
              fontSize: '0.68rem', padding: '3px 8px', borderRadius: '10px',
              background: badge.bg, color: badge.color,
              display: 'inline-block',
            }}
          >
            {badge.label}
          </motion.span>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '8px' }}>
        <motion.span
          key={days}
          initial={{ scale: 1.15, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          className="font-display"
          style={{ fontSize: '1.3rem', color: 'var(--ink)', lineHeight: 1 }}
        >
          {days === 0 ? '·' : days}
        </motion.span>
        <span style={{ fontSize: '0.74rem', color: 'var(--stone)' }}>
          {days === 0 ? 'Cycle en cours' : `jour${days > 1 ? 's' : ''} avant le prochain cycle`}
        </span>
      </div>
    </>
  );
}

function parseHour(time: string): number {
  if (!time) return 0;
  const [h] = time.split(':');
  const n = parseInt(h, 10);
  return isNaN(n) ? 0 : n;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const btnStyle: React.CSSProperties = {
  padding: '6px 10px', background: 'var(--warm-white)',
  border: '1px solid var(--border)', borderRadius: '8px',
  cursor: 'pointer', fontSize: '1rem', color: 'var(--ink)',
  fontFamily: 'inherit'
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px',
  border: '1px solid var(--border)', borderRadius: '7px',
  background: 'var(--warm-white)', fontSize: '0.82rem',
  color: 'var(--ink)', outline: 'none', fontFamily: 'inherit',
  boxSizing: 'border-box',
};
