'use client';
import AddButton from './AddButton';
import { Trash, TextReveal } from './animate-ui';
import { useState, useRef } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isToday, addMonths, subMonths, getDay, startOfDay,
  startOfWeek, endOfWeek, addWeeks, subWeeks,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Pencil, Clock, Repeat } from 'lucide-react';
import { useEvents, Event, RecurrenceType } from '@/hooks/useEvents';
import { useMenstrualCycle, computeCycleDays, daysUntilNextPeriod, CycleDay, MenstrualCycle } from '@/hooks/useMenstrualCycle';
import { useAuth } from '@/hooks/useAuth';

const CYCLE_ALLOWED_EMAIL = 'rstrpn05@gmail.com';

const PRESET_COLORS = ['#6B8F71', '#C0634A', '#C9973C', '#8075A8', '#4A90D9', '#E07B8A'];

const PRESET_CATEGORIES = [
  'Personnel',
  'Travail',
  'Projet',
  'Santé',
  'Rendez-vous',
  'Loisirs',
  'Études',
];

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

  const selectedEvents = events
    .filter(e => isSameDay(startOfDay(e.date), startOfDay(selectedDate)))
    .sort((a, b) => a.time.localeCompare(b.time));

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

    const finalCategory = formData.category.trim() || 'Personnel';

    if (editingBaseId) {
      await updateEvent(editingBaseId, {
        title: formData.title,
        time: formData.time || '09:00',
        duration: formData.duration,
        color: formData.color,
        category: finalCategory,
        recurrence: formData.recurrence,
      });
    } else {
      await addEvent({
        title: formData.title,
        date: startOfDay(selectedDate),
        time: formData.time || '09:00',
        duration: formData.duration,
        color: formData.color,
        category: finalCategory,
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
          <TextReveal
            as="h1"
            key={headerTitle}
            delay={0.06}
            className="font-display"
            style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--ink)', flexShrink: 0 }}
          >
            {headerTitle}
          </TextReveal>
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
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.15 }} onClick={goPrev} style={btnStyle}>‹</motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.95 }} 
                transition={{ duration: 0.15 }} 
                onClick={goToToday} 
                style={{ 
                  padding: '6px 14px',
                  background: 'var(--primary-btn-bg, var(--ink))',
                  color: 'var(--primary-btn-fg, var(--cream))',
                  border: 'none',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px var(--primary-btn-shadow, rgba(15,23,42,0.12))',
                  transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-btn-hover, var(--ink-light))'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary-btn-bg, var(--ink))'; }}
              >
                Aujourd&apos;hui
              </motion.button>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.15 }} onClick={goNext} style={btnStyle}>›</motion.button>
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
            <TextReveal
              key={format(selectedDate, 'yyyy-MM-dd') + '-day'}
              delay={0.04}
              style={{ fontSize: '0.72rem', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              {format(selectedDate, 'eeee', { locale: fr })}
            </TextReveal>
            <TextReveal
              key={format(selectedDate, 'yyyy-MM-dd') + '-date'}
              as="h2"
              delay={0.1}
              className="font-display"
              style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)' }}
            >
              {format(selectedDate, 'd MMMM', { locale: fr })}
            </TextReveal>
          </div>
          <AddButton onClick={openAddForm} />
        </div>

        {/* Add / Edit form */}
        <AnimatePresence>
        {showForm && (
          <motion.div
            key="event-form"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: 'var(--card, var(--warm-white))',
              borderRadius: 'var(--radius-xl, 14px)',
              padding: '16px',
              marginBottom: '16px',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
              transformOrigin: 'top center',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div className="font-display" style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--ink)' }}>
                {editingBaseId ? 'Modifier l\'événement' : 'Nouvel événement'}
              </div>
              <span style={{
                fontSize: '0.62rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '2px 8px',
                borderRadius: '9999px',
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
              }}>
                {editingBaseId ? 'Édition' : 'Agenda'}
              </span>
            </div>

            {/* Error */}
            <AnimatePresence>
              {formError && (
                <motion.div
                  key="form-error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--priority-high)',
                    background: 'var(--priority-high-bg)',
                    border: '1px solid var(--priority-high)',
                    borderRadius: 'var(--radius-md, 8px)',
                    padding: '6px 10px',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 500,
                  }}
                >
                  <span>⚠</span> {formError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Titre */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--stone)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Titre
              </label>
              <input
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Rendez-vous, Réunion…"
                style={inputStyle}
                autoFocus
              />
            </div>

            {/* Catégorie */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--stone)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Catégorie
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {PRESET_CATEGORIES.map(cat => {
                  const isSelected = formData.category.trim().toLowerCase() === cat.toLowerCase();
                  return (
                    <motion.button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat })}
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.03 }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        border: isSelected ? '1px solid var(--ink)' : '1px solid var(--border)',
                        background: isSelected ? 'var(--ink)' : 'var(--warm-white)',
                        color: isSelected ? 'var(--cream)' : 'var(--stone)',
                        fontSize: '0.74rem',
                        fontWeight: isSelected ? 600 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {cat}
                    </motion.button>
                  );
                })}
              </div>
              <input
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ou saisis une catégorie personnalisée…"
                style={{ ...inputStyle, fontSize: '0.8rem', padding: '8px 12px' }}
              />
            </div>

            {/* Time & Duration */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--stone)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Horaire
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={e => setFormData({ ...formData, time: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ width: '80px' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--stone)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Durée
                </label>
                <input
                  value={formData.duration}
                  onChange={e => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="1h"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Recurrence */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--stone)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Récurrence
              </label>
              <select
                value={formData.recurrence}
                onChange={e => setFormData({ ...formData, recurrence: e.target.value as RecurrenceType })}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {(Object.keys(RECURRENCE_LABELS) as RecurrenceType[]).map(r => (
                  <option key={r} value={r}>{RECURRENCE_LABELS[r]}</option>
                ))}
              </select>
              {editingBaseId && formData.recurrence !== 'none' && (
                <div style={{ fontSize: '0.7rem', color: 'var(--stone)', marginTop: '4px', fontStyle: 'italic' }}>
                  La modification s&apos;applique à toutes les occurrences.
                </div>
              )}
            </div>

            {/* Color picker */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--stone)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Couleur de l&apos;étiquette
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {PRESET_COLORS.map((c, i) => {
                  const isSelected = formData.color === c;
                  return (
                    <motion.button
                      key={c}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: c })}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: c, cursor: 'pointer', flexShrink: 0,
                        border: isSelected ? '2px solid var(--ink)' : '2px solid transparent',
                        boxShadow: isSelected ? '0 0 0 2px var(--card)' : '0 1px 2px rgba(0,0,0,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isSelected && (
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} />
                      )}
                    </motion.button>
                  );
                })}
                {/* Sélecteur libre — pastille arc-en-ciel */}
                <motion.label
                  title="Couleur personnalisée"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: !PRESET_COLORS.includes(formData.color)
                      ? formData.color
                      : 'conic-gradient(#6B8F71, #C9973C, #C0634A, #8075A8, #4A90D9, #E07B8A, #6B8F71)',
                    cursor: 'pointer', flexShrink: 0, overflow: 'hidden',
                    border: !PRESET_COLORS.includes(formData.color) ? '2px solid var(--ink)' : '2px solid transparent',
                    boxShadow: !PRESET_COLORS.includes(formData.color) ? '0 0 0 2px var(--card)' : '0 1px 2px rgba(0,0,0,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                    transition: 'all 0.15s ease',
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
                  {!PRESET_COLORS.includes(formData.color) && (
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} />
                  )}
                </motion.label>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <motion.button
                onClick={handleSubmit}
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  flex: 1, padding: '10px 14px',
                  background: 'var(--primary-btn-bg, var(--ink))', color: 'var(--primary-btn-fg, var(--cream))',
                  border: 'none', borderRadius: '14px', cursor: 'pointer',
                  fontSize: '0.84rem', fontFamily: 'inherit', fontWeight: 600,
                  boxShadow: '0 2px 8px var(--primary-btn-shadow, rgba(15, 23, 42, 0.12))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-btn-hover, var(--ink-light))'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary-btn-bg, var(--ink))'; }}
              >
                {editingBaseId ? 'Enregistrer' : 'Ajouter'}
              </motion.button>
              <motion.button
                onClick={closeForm}
                whileHover={{ scale: 1.02, background: 'var(--muted)' }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  padding: '10px 16px',
                  background: 'transparent', color: 'var(--stone)',
                  border: '1px solid var(--border)', borderRadius: '14px', cursor: 'pointer',
                  fontSize: '0.84rem', fontFamily: 'inherit', fontWeight: 500,
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
                    whileTap={{ scale: 0.96 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      flex: 1, padding: '8px 12px',
                      background: 'var(--primary-btn-bg, var(--ink))', color: 'var(--primary-btn-fg, var(--cream))',
                      border: 'none', borderRadius: '14px', cursor: 'pointer',
                      fontSize: '0.8rem', fontFamily: 'inherit', fontWeight: 600,
                      boxShadow: '0 2px 6px var(--primary-btn-shadow, rgba(15, 23, 42, 0.12))',
                    }}
                  >
                    Enregistrer
                  </motion.button>
                  <motion.button
                    onClick={() => setShowCycleForm(false)}
                    whileTap={{ scale: 0.96 }}
                    whileHover={{ scale: 1.02, background: 'var(--muted)' }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      padding: '8px 12px',
                      background: 'transparent', color: 'var(--stone)',
                      border: '1px solid var(--border)', borderRadius: '14px', cursor: 'pointer',
                      fontSize: '0.8rem', fontFamily: 'inherit', fontWeight: 500,
                    }}
                  >
                    Annuler
                  </motion.button>
                  {cycle && (
                    <motion.button
                      onClick={async () => { await deleteCycle(); setShowCycleForm(false); }}
                      whileTap={{ scale: 0.96 }}
                      whileHover={{ scale: 1.02, background: 'var(--priority-high-bg)' }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        padding: '8px 12px',
                        background: 'transparent', color: 'var(--priority-high)',
                        border: '1px solid var(--border)', borderRadius: '14px', cursor: 'pointer',
                        fontSize: '0.8rem', fontFamily: 'inherit', fontWeight: 500,
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

        {/* Events list / Tickets Minimalistes */}
        <motion.div layout style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                  layout
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.95, transition: { duration: 0.2, ease: 'easeOut' } }}
                  transition={{
                    duration: 0.35,
                    delay: Math.min(i * 0.05, 0.25),
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  whileHover={{
                    y: -3,
                    boxShadow: `0 10px 26px rgba(15, 23, 42, 0.08), 0 0 0 1px ${event.color}44`,
                  }}
                  style={{
                    position: 'relative',
                    background: `radial-gradient(ellipse at 0% 0%, ${event.color}14 0%, transparent 70%), var(--card, var(--warm-white))`,
                    borderRadius: '16px',
                    padding: '14px 16px',
                    border: '1px solid var(--border)',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                    transition: 'border-color 0.2s ease, box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    overflow: 'hidden',
                  }}
                >
                  {/* En-tête : Puce lumineuse Glow LED + Catégorie + Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: event.color,
                          boxShadow: `0 0 8px ${event.color}, 0 0 2px ${event.color}`,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          letterSpacing: '0.07em',
                          textTransform: 'uppercase',
                          color: 'var(--stone)',
                        }}
                      >
                        {event.category}
                      </span>
                      {event.recurrence !== 'none' && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '0.65rem',
                            color: 'var(--stone)',
                            background: 'var(--warm-white)',
                            padding: '1px 6px',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <Repeat size={9} />
                          {RECURRENCE_LABELS[event.recurrence]}
                        </span>
                      )}
                    </div>

                    {/* Actions boutons (Modifier & Supprimer) */}
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <motion.button
                        onClick={() => openEditForm(event)}
                        title="Modifier l'événement"
                        whileTap={{ scale: 0.92 }}
                        whileHover={{ scale: 1.08, background: 'var(--muted)' }}
                        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          padding: '5px 7px',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          background: 'transparent',
                          cursor: 'pointer',
                          color: 'var(--stone)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          transition: 'color 0.15s ease, background 0.15s ease',
                        }}
                      >
                        <Pencil size={13} />
                      </motion.button>
                      <motion.button
                        onClick={() => handleDelete(event)}
                        title="Supprimer l'événement"
                        whileTap={{ scale: 0.92 }}
                        whileHover={{ scale: 1.08, background: 'var(--priority-high-bg)' }}
                        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          padding: '5px 7px',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          background: 'transparent',
                          cursor: 'pointer',
                          color: 'var(--priority-high)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <Trash size={13} color="var(--priority-high)" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Ligne pointillée fine style ticket */}
                  <div
                    style={{
                      height: '1px',
                      margin: '10px 0 11px 0',
                      borderBottom: '1px dashed var(--border)',
                      opacity: 0.85,
                    }}
                  />

                  {/* Titre de l'événement avec TextReveal */}
                  <TextReveal delay={0.06 + Math.min(i * 0.04, 0.2)} duration={0.4}>
                    <div
                      style={{
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        color: 'var(--ink)',
                        lineHeight: 1.38,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {event.title}
                    </div>
                  </TextReveal>

                  {/* Pied du ticket : Heure et Durée */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '10px',
                      fontSize: '0.75rem',
                      color: 'var(--stone)',
                    }}
                  >
                    <Clock size={12} style={{ color: event.color }} />
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{event.time}</span>
                    <span>·</span>
                    <span>{event.duration}</span>
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
      background: 'var(--warm-white)', borderRadius: 'var(--radius-xl, 14px)',
      border: '1px solid var(--border)',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '96px' }}>
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} style={{ borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }} />
        ))}
        {days.map(day => {
          const dayEvents = events.filter(e => isSameDay(startOfDay(e.date), startOfDay(day)));
          const selected = isSameDay(day, selectedDate);
          const today = isToday(day);
          const cycleDay = cycleDays.find(cd => isSameDay(startOfDay(cd.date), startOfDay(day)));
          const cycleBg = cycleDay?.type === 'period' ? 'rgba(212, 96, 126, 0.08)'
            : cycleDay?.type === 'predicted-period' ? 'rgba(212, 96, 126, 0.05)'
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
                background: selected ? 'var(--accent-soft)' : cycleBg ?? 'transparent',
                transition: 'background 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px' }}>
                <div style={{
                  width: '26px', height: '26px',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem',
                  background: today ? 'var(--accent)' : selected ? 'var(--accent-soft)' : 'transparent',
                  color: today ? 'white' : selected ? 'var(--accent)' : 'var(--ink)',
                  fontWeight: today ? '700' : selected ? '600' : '500',
                  transition: 'all 0.15s ease',
                }}>
                  {format(day, 'd')}
                </div>
                {(cycleDay?.type === 'period' || cycleDay?.type === 'predicted-period') && (
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                    background: '#D4607E',
                  }} />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {dayEvents.slice(0, 2).map(e => {
                  const isHex = e.color.startsWith('#') && e.color.length === 7;
                  const bg = isHex ? `${e.color}15` : 'var(--accent-soft)';
                  const border = isHex ? `${e.color}35` : 'var(--border)';
                  return (
                    <motion.div
                      key={e.id}
                      title={`${e.time} ${e.title}`}
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -1, scale: 1.02 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        fontSize: '0.67rem',
                        padding: '3px 6px',
                        borderRadius: '6px',
                        color: 'var(--ink)',
                        background: bg,
                        border: `1px solid ${border}`,
                        borderLeft: `3px solid ${e.color}`,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        color: e.color,
                        flexShrink: 0,
                        letterSpacing: '-0.02em',
                      }}>
                        {e.time}
                      </span>
                      {e.recurrence !== 'none' && (
                        <span style={{ fontSize: '0.6rem', opacity: 0.65, flexShrink: 0 }}>↻</span>
                      )}
                      <span style={{
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        fontWeight: 500,
                      }}>
                        {e.title}
                      </span>
                    </motion.div>
                  );
                })}
                {dayEvents.length > 2 && (
                  <div style={{
                    fontSize: '0.6rem',
                    fontWeight: 600,
                    color: 'var(--stone)',
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    background: 'var(--muted)',
                    alignSelf: 'flex-start',
                    marginTop: '1px',
                  }}>
                    +{dayEvents.length - 2} autre{dayEvents.length - 2 > 1 ? 's' : ''}
                  </div>
                )}
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
                        <motion.div
                          key={e.id}
                          data-event-block
                          title={`${e.time} – ${e.title} (${e.duration})`}
                          whileHover={!isDragging && !isResizing ? { scale: 1.01, boxShadow: '0 4px 12px rgba(15, 23, 42, 0.1)' } : undefined}
                          style={{
                            position: 'absolute',
                            top: `${topOffset}px`,
                            left: '3px',
                            right: '3px',
                            background: e.color + (isDragging ? '10' : '18'),
                            border: `1px solid ${e.color}35`,
                            borderLeft: `3px solid ${e.color}`,
                            color: 'var(--ink)',
                            borderRadius: '10px',
                            padding: '4px 7px 10px',
                            fontSize: '0.67rem',
                            lineHeight: 1.35,
                            overflow: 'hidden',
                            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                            zIndex: isDragging ? 0 : 1,
                            opacity: isDragging ? 0.25 : 1,
                            cursor: (dragState || resizeState) ? 'grabbing' : 'grab',
                            userSelect: 'none',
                            transition: 'opacity 140ms cubic-bezier(0.16, 1, 0.3, 1), background 140ms cubic-bezier(0.16, 1, 0.3, 1)',
                            animation: isDragging ? 'none' : 'eventFadeIn 180ms cubic-bezier(0.16, 1, 0.3, 1) both',
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
                        </motion.div>
                      );
                    })}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Drag ghost */}
        {/* eslint-disable-next-line react-hooks/refs */}
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
  padding: '6px 14px', background: 'var(--card, var(--warm-white))',
  border: '1px solid var(--border)', borderRadius: '14px',
  cursor: 'pointer', fontSize: '0.84rem', color: 'var(--ink)',
  fontFamily: 'inherit', fontWeight: 500,
  transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1px solid var(--border)', borderRadius: '14px',
  background: 'var(--cream)', fontSize: '0.84rem',
  color: 'var(--ink)', outline: 'none', fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: 'border-color 0.22s ease, box-shadow 0.22s ease',
};
