'use client';
import AddButton from './AddButton';
import { Trash } from './animate-ui';
import { useState, useRef } from 'react';
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

const PRESET_COLORS = ['#6B8F71', '#C0634A', '#C9973C', '#8075A8', '#4A90D9', '#E07B8A'];

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
const HOURS = Array.from({ length: 16 }, (_, i) => i + 8);

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
  color: PRESET_COLORS[0],
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
            onUpdateEvent={updateEvent}
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
        <AnimatePresence>
        {showForm && (
          <motion.div
            key="event-form"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            style={{
              background: 'var(--warm-white)', borderRadius: '12px',
              padding: '16px', marginBottom: '16px',
              border: '1px solid var(--border)',
              transformOrigin: 'top center',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--stone)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {editingBaseId ? 'Modifier l\'événement' : 'Nouvel événement'}
            </div>

            <input
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Titre de l'événement"
              style={inputStyle}
            />

            <AnimatePresence>
              {formError && (
                <motion.div
                  key="form-error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                  style={{ fontSize: '0.75rem', color: 'var(--terra)', marginTop: '6px' }}
                >
                  {formError}
                </motion.div>
              )}
            </AnimatePresence>

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
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', alignItems: 'center' }}>
              {PRESET_COLORS.map((c, i) => (
                <motion.div
                  key={c}
                  onClick={() => setFormData({ ...formData, color: c })}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.18, delay: i * 0.04, ease: [0.23, 1, 0.32, 1] }}
                  whileHover={{ scale: 1.18 }}
                  whileTap={{ scale: 0.88 }}
                  style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: c, cursor: 'pointer', flexShrink: 0,
                    border: formData.color === c ? '2px solid var(--ink)' : '2px solid transparent',
                    outline: formData.color === c ? '2px solid var(--warm-white)' : 'none',
                    outlineOffset: '-4px',
                    transition: 'border 150ms cubic-bezier(0.23, 1, 0.32, 1), outline 150ms cubic-bezier(0.23, 1, 0.32, 1)',
                  }}
                />
              ))}
              {/* Sélecteur libre — pastille arc-en-ciel */}
              <motion.label
                title="Couleur personnalisée"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.18, delay: PRESET_COLORS.length * 0.04, ease: [0.23, 1, 0.32, 1] }}
                whileHover={{ scale: 1.18 }}
                whileTap={{ scale: 0.88 }}
                style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: !PRESET_COLORS.includes(formData.color)
                    ? formData.color
                    : 'conic-gradient(#6B8F71, #C9973C, #C0634A, #8075A8, #4A90D9, #E07B8A, #6B8F71)',
                  cursor: 'pointer', flexShrink: 0, overflow: 'hidden',
                  border: !PRESET_COLORS.includes(formData.color) ? '2px solid var(--ink)' : '2px solid transparent',
                  outline: !PRESET_COLORS.includes(formData.color) ? '2px solid var(--warm-white)' : 'none',
                  outlineOffset: '-4px',
                  transition: 'border 150ms cubic-bezier(0.23, 1, 0.32, 1), background 150ms ease-out',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <input
                  type="color"
                  aria-label="Choisir une couleur personnalisée"
                  value={/^#[0-9A-Fa-f]{6}$/.test(formData.color) ? formData.color : PRESET_COLORS[0]}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                  style={{
                    position: 'absolute', inset: 0,
                    opacity: 0, width: '100%', height: '100%',
                    cursor: 'pointer', border: 'none', padding: 0,
                  }}
                />
              </motion.label>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <motion.button
                onClick={handleSubmit}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.1, ease: [0.23, 1, 0.32, 1] }}
                style={{
                  flex: 1, padding: '8px',
                  background: 'var(--ink)', color: 'var(--cream)',
                  border: 'none', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '0.82rem', fontFamily: 'inherit',
                }}
              >
                {editingBaseId ? 'Enregistrer' : 'Ajouter'}
              </motion.button>
              <motion.button
                onClick={closeForm}
                whileHover={{ background: 'var(--border)' }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                style={{
                  padding: '8px 12px',
                  background: 'transparent', color: 'var(--stone)',
                  border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '0.82rem', fontFamily: 'inherit',
                }}
              >
                Annuler
              </motion.button>
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Cycle menstruel — visible uniquement pour rstrpn05@gmail.com */}
        {isCycleUser && <motion.div
          layout
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
        <motion.div layout style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
        </motion.div>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '90px' }}>
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} style={{ borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }} />
        ))}
        {days.map(day => {
          const dayEvents = events.filter(e => isSameDay(startOfDay(e.date), startOfDay(day)));
          const selected = isSameDay(day, selectedDate);
          const today = isToday(day);
          const cycleDay = cycleDays.find(cd => isSameDay(startOfDay(cd.date), startOfDay(day)));
          const cycleBg = cycleDay?.type === 'period' ? 'rgba(192, 99, 74, 0.08)'
            : cycleDay?.type === 'predicted-period' ? 'rgba(192, 99, 74, 0.05)'
            : undefined;
          return (
            <div
              key={day.toString()}
              onClick={() => onSelectDate(startOfDay(day))}
              style={{
                borderRight: '1px solid var(--border)',
                borderBottom: '1px solid var(--border)',
                overflow: 'hidden',
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
                {(cycleDay?.type === 'period' || cycleDay?.type === 'predicted-period') && (
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                    background: '#C2185B',
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

interface DragState {
  eventId: string;
  baseId: string;
  previewDay: Date;
  previewTime: string;
  grabOffsetMin: number;
  durationMin: number;
  color: string;
  title: string;
}

interface ResizeState {
  eventId: string;
  baseId: string;
  startClientY: number;
  origDurationMin: number;
  currentDurationMin: number;
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function formatDurationFromMin(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}`;
}

function WeekGrid({
  weekDays, events, selectedDate, onSelectDate, cycleDays, onUpdateEvent,
}: {
  weekDays: Date[];
  events: Event[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  cycleDays: CycleDay[];
  onUpdateEvent: (id: string, fields: Partial<Omit<Event, 'id' | 'baseId'>>) => void;
}) {
  const scrollableRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);

  const handleEventPointerDown = (e: React.PointerEvent, event: Event) => {
    e.stopPropagation();
    e.preventDefault();
    const el = scrollableRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relY = e.clientY - rect.top + el.scrollTop;
    const eventTopPx = (parseHour(event.time) - 8) * HOUR_HEIGHT + parseStartMinutes(event.time) * (HOUR_HEIGHT / 60);
    const durationMin = Math.round(parseDurationHours(event.duration) * 60);
    const grabOffsetMin = Math.max(0, Math.min(durationMin - 15, (relY - eventTopPx) / HOUR_HEIGHT * 60));
    setDragState({
      eventId: event.id,
      baseId: event.baseId ?? event.id,
      previewDay: event.date,
      previewTime: event.time,
      grabOffsetMin: Math.round(grabOffsetMin / 15) * 15,
      durationMin,
      color: event.color,
      title: event.title,
    });
    el.setPointerCapture(e.pointerId);
  };

  const handleResizePointerDown = (e: React.PointerEvent, event: Event) => {
    e.stopPropagation();
    e.preventDefault();
    const el = scrollableRef.current;
    if (!el) return;
    const origDurationMin = Math.round(parseDurationHours(event.duration) * 60);
    setResizeState({
      eventId: event.id,
      baseId: event.baseId ?? event.id,
      startClientY: e.clientY,
      origDurationMin,
      currentDurationMin: origDurationMin,
    });
    el.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const el = scrollableRef.current;
    if (!el || (!dragState && !resizeState)) return;

    if (dragState) {
      const rect = el.getBoundingClientRect();
      const scrollTop = el.scrollTop;

      // Compute new hour+min from Y (snap to 15min), accounting for grab offset
      const relY = e.clientY - rect.top + scrollTop - dragState.grabOffsetMin * (HOUR_HEIGHT / 60);
      const totalMin = Math.max(0, relY / HOUR_HEIGHT * 60);
      const rawHour = Math.floor(totalMin / 60) + 8;
      const rawMin = totalMin % 60;
      const snappedMin = Math.round(rawMin / 15) * 15;
      const overflow = snappedMin >= 60 ? 1 : 0;
      const finalMin = snappedMin % 60;
      const finalHour = Math.min(22, Math.max(8, rawHour + overflow));

      // Compute target day column from X
      const colWidth = (rect.width - 48) / 7;
      const relX = e.clientX - rect.left - 48;
      const colIdx = Math.min(6, Math.max(0, Math.floor(relX / colWidth)));

      setDragState(prev => prev ? {
        ...prev,
        previewDay: weekDays[colIdx],
        previewTime: formatTime(finalHour, finalMin),
      } : null);
    }

    if (resizeState) {
      const deltaY = e.clientY - resizeState.startClientY;
      const deltaMins = deltaY / HOUR_HEIGHT * 60;
      const newDuration = Math.max(15, Math.round((resizeState.origDurationMin + deltaMins) / 15) * 15);
      setResizeState(prev => prev ? { ...prev, currentDurationMin: newDuration } : null);
    }
  };

  const handlePointerUp = () => {
    if (dragState) {
      onUpdateEvent(dragState.baseId, {
        date: startOfDay(dragState.previewDay),
        time: dragState.previewTime,
      });
      setDragState(null);
    }
    if (resizeState) {
      onUpdateEvent(resizeState.baseId, {
        duration: formatDurationFromMin(resizeState.currentDurationMin),
      });
      setResizeState(null);
    }
  };

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
              {(cycleDay?.type === 'period' || cycleDay?.type === 'predicted-period') && (
                <div style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  margin: '2px auto 0', flexShrink: 0,
                  background: '#C2185B',
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div
        ref={scrollableRef}
        style={{ overflowY: 'auto', maxHeight: '580px', position: 'relative' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '48px repeat(7, 1fr)' }}>
          {HOURS.map(hour => (
            <React.Fragment key={hour}>
              {/* Hour label */}
              <div style={{
                height: `${HOUR_HEIGHT}px`,
                borderRight: '1px solid var(--border)',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
                paddingRight: '6px', paddingTop: '4px',
                fontSize: '0.65rem', color: 'var(--stone)',
                userSelect: 'none',
              }}>
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
                      cursor: 'pointer',
                      background: selected ? 'rgba(122, 140, 110, 0.05)' : 'transparent',
                      transition: 'background 0.1s',
                      position: 'relative',
                    }}
                  >
                    {dayEvents.map(e => {
                      const isDragging = dragState?.eventId === e.id;
                      const isResizing = resizeState?.eventId === e.id;
                      const durationMin = isResizing
                        ? resizeState!.currentDurationMin
                        : Math.round(parseDurationHours(e.duration) * 60);
                      const durationH = durationMin / 60;
                      const topOffset = parseStartMinutes(e.time) * (HOUR_HEIGHT / 60);
                      const blockHeight = Math.max(durationH, 0.25) * HOUR_HEIGHT - 2;
                      return (
                        <div
                          key={e.id}
                          data-event-block
                          title={`${e.time} – ${e.title} (${e.duration})`}
                          style={{
                            position: 'absolute',
                            top: `${topOffset}px`,
                            left: '3px',
                            right: '3px',
                            height: `${blockHeight}px`,
                            background: e.color + (isDragging ? '10' : '18'),
                            borderLeft: `3px solid ${e.color}`,
                            color: 'var(--ink)',
                            borderRadius: '6px',
                            padding: '3px 5px 10px',
                            fontSize: '0.65rem',
                            lineHeight: 1.3,
                            overflow: 'hidden',
                            zIndex: isDragging ? 0 : 1,
                            opacity: isDragging ? 0.25 : 1,
                            cursor: (dragState || resizeState) ? 'grabbing' : 'grab',
                            userSelect: 'none',
                            transition: 'opacity 140ms cubic-bezier(0.23, 1, 0.32, 1), background 140ms cubic-bezier(0.23, 1, 0.32, 1)',
                            animation: isDragging ? 'none' : 'eventFadeIn 180ms cubic-bezier(0.23, 1, 0.32, 1) both',
                          }}
                          onPointerDown={e2 => handleEventPointerDown(e2, e)}
                        >
                          <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {e.title}
                          </div>
                          {durationH >= 0.5 && (
                            <div style={{ opacity: 0.7, fontSize: '0.63rem', marginTop: '1px' }}>
                              {e.time}{e.recurrence !== 'none' ? ' ↻' : ''}
                            </div>
                          )}
                          {/* Resize handle */}
                          <div
                            data-resize-handle
                            onPointerDown={e2 => handleResizePointerDown(e2, e)}
                            style={{
                              position: 'absolute',
                              bottom: 0, left: 0, right: 0,
                              height: '10px',
                              cursor: 'ns-resize',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <div style={{
                              width: '24px', height: '2px', borderRadius: '1px',
                              background: e.color,
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Drag ghost */}
        {dragState && (() => {
          const el = scrollableRef.current;
          const colWidth = el ? (el.offsetWidth - 48) / 7 : 100;
          const colIdx = weekDays.findIndex(d => isSameDay(d, dragState.previewDay));
          if (colIdx === -1) return null;
          const ghostHour = parseHour(dragState.previewTime);
          const ghostMin = parseStartMinutes(dragState.previewTime);
          const top = (ghostHour - 8) * HOUR_HEIGHT + ghostMin * (HOUR_HEIGHT / 60);
          const height = Math.max(dragState.durationMin, 15) * HOUR_HEIGHT / 60 - 2;
          return (
            <div style={{
              position: 'absolute',
              top: `${top}px`,
              left: `${48 + colIdx * colWidth + 3}px`,
              width: `${colWidth - 6}px`,
              height: `${height}px`,
              background: dragState.color + '33',
              borderLeft: `3px solid ${dragState.color}`,
              borderRadius: '6px',
              padding: '3px 5px',
              fontSize: '0.65rem',
              lineHeight: 1.3,
              color: 'var(--ink)',
              zIndex: 10,
              pointerEvents: 'none',
              boxShadow: `0 8px 32px rgba(0,0,0,0.16), 0 2px 8px ${dragState.color}22`,
              fontWeight: 600,
              overflow: 'hidden',
              userSelect: 'none',
              animation: 'ghostFadeIn 120ms cubic-bezier(0.23, 1, 0.32, 1) both',
              transition: 'top 70ms cubic-bezier(0.23, 1, 0.32, 1), left 70ms cubic-bezier(0.23, 1, 0.32, 1), height 70ms cubic-bezier(0.23, 1, 0.32, 1)',
            }}>
              {dragState.title}
              <div style={{ opacity: 0.7, fontSize: '0.63rem', marginTop: '1px' }}>
                {dragState.previewTime}
              </div>
            </div>
          );
        })()}
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

function parseStartMinutes(time: string): number {
  if (!time) return 0;
  const parts = time.split(':');
  return parts.length >= 2 ? (parseInt(parts[1], 10) || 0) : 0;
}

function parseDurationHours(duration: string): number {
  if (!duration) return 1;
  const s = duration.trim().toLowerCase();
  // "1h30min" ou "1h30" ou "1h"
  const hMin = s.match(/^(\d+(?:\.\d+)?)h\s*(\d+)?(?:min)?$/);
  if (hMin) return parseFloat(hMin[1]) + (hMin[2] ? parseInt(hMin[2], 10) / 60 : 0);
  // "30min"
  const min = s.match(/^(\d+)\s*min$/);
  if (min) return parseInt(min[1], 10) / 60;
  // nombre seul → heures
  const n = parseFloat(s);
  return isNaN(n) ? 1 : n;
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
