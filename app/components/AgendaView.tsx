'use client';
import AddButton from './AddButton';
import { Trash, TextReveal } from './animate-ui';
import { useState, useRef, useEffect, useMemo } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isToday, addMonths, subMonths, getDay, startOfDay,
  startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, differenceInDays,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Pencil, Clock, Repeat, ChevronLeft, ChevronRight, Calendar, Sparkles, Plus, Check } from 'lucide-react';
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

const PRESET_DURATIONS = ['15min', '30min', '45min', '1h', '1h30', '2h'];

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
  const hMin = s.match(/^(\d+(?:\.\d+)?)h\s*(\d+)?(?:min)?$/);
  if (hMin) return parseFloat(hMin[1]) + (hMin[2] ? parseInt(hMin[2], 10) / 60 : 0);
  const min = s.match(/^(\d+)\s*min$/);
  if (min) return parseInt(min[1], 10) / 60;
  const n = parseFloat(s);
  return isNaN(n) ? 1 : n;
}

function formatEndTime(startTime: string, duration: string): string {
  if (!startTime) return '';
  const [h, m] = startTime.split(':').map(n => parseInt(n, 10) || 0);
  const durH = parseDurationHours(duration);
  const totalMin = h * 60 + m + Math.round(durH * 60);
  const endH = Math.floor(totalMin / 60) % 24;
  const endM = totalMin % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

function getDayStatus(dayEvents: Event[], selectedDate: Date): { label: string; type: 'now' | 'upcoming' | 'done' | 'empty'; sub?: string } {
  if (dayEvents.length === 0) {
    return { label: 'Journée libre', type: 'empty', sub: 'Aucun événement prévu' };
  }
  if (!isToday(selectedDate)) {
    return {
      label: `${dayEvents.length} prévu${dayEvents.length > 1 ? 's' : ''}`,
      type: 'upcoming',
      sub: `${dayEvents.length} événement${dayEvents.length > 1 ? 's' : ''} au planning`,
    };
  }

  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  // En cours ?
  for (const e of dayEvents) {
    const [h, m] = e.time.split(':').map(n => parseInt(n, 10) || 0);
    const startM = h * 60 + m;
    const durM = Math.round(parseDurationHours(e.duration) * 60);
    const endM = startM + durM;
    if (currentMin >= startM && currentMin < endM) {
      return { label: 'En cours', type: 'now', sub: e.title };
    }
  }

  // Prochain événement ?
  const upcoming = dayEvents
    .map(e => {
      const [h, m] = e.time.split(':').map(n => parseInt(n, 10) || 0);
      return { event: e, startM: h * 60 + m };
    })
    .filter(item => item.startM > currentMin)
    .sort((a, b) => a.startM - b.startM);

  if (upcoming.length > 0) {
    const diff = upcoming[0].startM - currentMin;
    if (diff < 60) {
      return { label: `Dans ${diff} min`, type: 'upcoming', sub: upcoming[0].event.title };
    }
    const diffH = Math.floor(diff / 60);
    const remM = diff % 60;
    return {
      label: `Dans ${diffH}h${remM > 0 ? (remM < 10 ? '0' + remM : remM) : ''}`,
      type: 'upcoming',
      sub: upcoming[0].event.title,
    };
  }

  return { label: 'Journée terminée', type: 'done', sub: 'Tous les événements sont passés' };
}

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

  // Calcul du nombre d'événements dans la vue active
  const currentViewEventsCount = useMemo(() => {
    if (view === 'month') {
      const mStart = startOfMonth(currentMonth);
      const mEnd = endOfMonth(currentMonth);
      return events.filter(e => {
        const d = startOfDay(e.date);
        return d >= mStart && d <= mEnd;
      }).length;
    } else {
      const wStart = currentWeekStart;
      const wEnd = endOfWeek(currentWeekStart, WEEK_OPTS);
      return events.filter(e => {
        const d = startOfDay(e.date);
        return d >= wStart && d <= wEnd;
      }).length;
    }
  }, [events, view, currentMonth, currentWeekStart]);

  // Title for the header avec première lettre en majuscule
  const rawTitle = view === 'month'
    ? format(currentMonth, 'MMMM yyyy', { locale: fr })
    : `${format(currentWeekStart, 'd MMM', { locale: fr })} – ${format(endOfWeek(currentWeekStart, WEEK_OPTS), 'd MMM yyyy', { locale: fr })}`;
  const headerTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);

  const dayStatus = getDayStatus(selectedEvents, selectedDate);

  return (
    <div className="agenda-view-container">
      {/* Calendar Bento Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
        {/* Header Bento Card avec animation d'apparition */}
        <motion.div
          className="agenda-bento-card"
          initial={{ opacity: 0, y: 16, scale: 0.98, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Calendar size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TextReveal
                  as="h1"
                  key={headerTitle}
                  delay={0.06}
                  className="font-display"
                  style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.2 }}
                >
                  {headerTitle}
                </TextReveal>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: 'var(--accent-soft)',
                  color: 'var(--accent)',
                  border: '1px solid var(--border)',
                }}>
                  {currentViewEventsCount} prévu{currentViewEventsCount > 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--stone)', fontWeight: 500, marginTop: '2px' }}>
                {view === 'month' ? 'Vue mensuelle globale' : 'Planification hebdomadaire'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {/* View toggle capsule */}
            <div style={{
              display: 'flex',
              background: 'var(--cream)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
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
                    color: view === v ? 'var(--primary-btn-fg, var(--cream))' : 'var(--stone)',
                    fontWeight: view === v ? 600 : 500,
                    borderRadius: '9px',
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
                        background: 'var(--primary-btn-bg, var(--ink))',
                        borderRadius: '9px',
                        zIndex: -1,
                        boxShadow: '0 2px 6px var(--primary-btn-shadow, rgba(15, 23, 42, 0.12))',
                      }}
                      transition={{ type: 'spring', duration: 0.32, bounce: 0.15 }}
                    />
                  )}
                  {v === 'month' ? 'Mois' : 'Semaine'}
                </motion.button>
              ))}
            </div>

            {/* Navigation pills */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <motion.button
                whileHover={{ scale: 1.06, background: 'var(--muted)' }}
                whileTap={{ scale: 0.94 }}
                transition={{ duration: 0.15 }}
                onClick={goPrev}
                title="Précédent"
                style={{
                  ...btnStyle,
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronLeft size={16} />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.03 }} 
                whileTap={{ scale: 0.96 }} 
                transition={{ duration: 0.15 }} 
                onClick={goToToday} 
                style={{ 
                  padding: '6px 14px',
                  background: 'var(--primary-btn-bg, var(--ink))',
                  color: 'var(--primary-btn-fg, var(--cream))',
                  border: 'none',
                  borderRadius: '12px',
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
              <motion.button
                whileHover={{ scale: 1.06, background: 'var(--muted)' }}
                whileTap={{ scale: 0.94 }}
                transition={{ duration: 0.15 }}
                onClick={goNext}
                title="Suivant"
                style={{
                  ...btnStyle,
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronRight size={16} />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Grille Bento Calendrier avec apparition cinématique */}
        <motion.div
          className="agenda-bento-card"
          initial={{ opacity: 0, y: 22, scale: 0.97, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.65, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          style={{ padding: '0', overflow: 'hidden', position: 'relative' }}
        >
          {/* Ligne d'accent lumineuse supérieure */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, transparent 0%, var(--accent) 50%, transparent 100%)',
              transformOrigin: 'center',
              zIndex: 10,
            }}
          />

          {/* Balayage lumineux satiné (Light Sheen) */}
          <motion.div
            initial={{ x: '-100%', opacity: 0.5 }}
            animate={{ x: '250%', opacity: 0 }}
            transition={{ duration: 1.1, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: '45%',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.35) 50%, transparent 100%)',
              pointerEvents: 'none',
              zIndex: 11,
            }}
          />

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={view === 'month' ? `month-${format(currentMonth, 'yyyy-MM')}` : `week-${format(currentWeekStart, 'yyyy-MM-dd')}`}
              initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
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
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Right Column: Focus du Jour & Timeline */}
      <div className="agenda-sidebar-panel">
        <div className="agenda-bento-card" style={{ padding: '20px' }}>
          {/* Header Focus */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '16px',
            gap: '12px',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <TextReveal
                  key={format(selectedDate, 'yyyy-MM-dd') + '-day'}
                  delay={0.04}
                  style={{ fontSize: '0.72rem', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}
                >
                  {format(selectedDate, 'eeee', { locale: fr })}
                </TextReveal>
                {isToday(selectedDate) && (
                  <span style={{
                    fontSize: '0.62rem',
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    background: 'var(--accent)',
                    color: '#fff',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    Aujourd&apos;hui
                  </span>
                )}
              </div>
              <TextReveal
                key={format(selectedDate, 'yyyy-MM-dd') + '-date'}
                as="h2"
                delay={0.08}
                className="font-display"
                style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.2 }}
              >
                {format(selectedDate, 'd MMMM', { locale: fr })}
              </TextReveal>

              {/* Status Countdown Chip */}
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '8px',
                  padding: '3px 9px',
                  borderRadius: '9999px',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  background: dayStatus.type === 'now'
                    ? 'rgba(239, 68, 68, 0.12)'
                    : dayStatus.type === 'upcoming'
                    ? 'var(--accent-soft)'
                    : 'var(--muted)',
                  color: dayStatus.type === 'now'
                    ? '#EF4444'
                    : dayStatus.type === 'upcoming'
                    ? 'var(--accent)'
                    : 'var(--stone)',
                  border: dayStatus.type === 'now'
                    ? '1px solid rgba(239, 68, 68, 0.3)'
                    : '1px solid var(--border)',
                }}
              >
                {dayStatus.type === 'now' && (
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#EF4444',
                    boxShadow: '0 0 8px #EF4444',
                    animation: 'pulse 1.5s infinite',
                  }} />
                )}
                {dayStatus.type === 'upcoming' && <Sparkles size={11} />}
                {dayStatus.type === 'done' && <Check size={11} />}
                {dayStatus.type === 'empty' && <Calendar size={11} />}
                <span>{dayStatus.label}</span>
              </motion.div>
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
                borderRadius: '16px',
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
                  placeholder="Ex: Réunion d'équipe, Séance sport…"
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
                  placeholder="Ou catégorie personnalisée…"
                  style={{ ...inputStyle, fontSize: '0.8rem', padding: '8px 12px' }}
                />
              </div>

              {/* Time & Duration */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
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
                <div style={{ width: '90px' }}>
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

              {/* Quick duration presets */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {PRESET_DURATIONS.map(d => (
                    <motion.button
                      key={d}
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      onClick={() => setFormData({ ...formData, duration: d })}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        border: formData.duration === d ? '1px solid var(--accent)' : '1px solid var(--border)',
                        background: formData.duration === d ? 'var(--accent-soft)' : 'transparent',
                        color: formData.duration === d ? 'var(--accent)' : 'var(--stone)',
                        fontSize: '0.68rem',
                        fontWeight: formData.duration === d ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {d}
                    </motion.button>
                  ))}
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
                  {PRESET_COLORS.map(c => {
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
            initial={{ opacity: 0, y: 24, scale: 0.96, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.94) 0%, rgba(254, 240, 245, 0.9) 100%)',
              borderRadius: '20px',
              padding: '16px 18px 16px',
              marginBottom: '18px',
              border: '1px solid rgba(240, 212, 228, 0.85)',
              boxShadow: '0 10px 28px -6px rgba(212, 96, 126, 0.12), 0 2px 6px rgba(212, 96, 126, 0.04)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Voile lumineux d'apparition (Light Sheen) */}
            <motion.div
              initial={{ x: '-100%', opacity: 0.7 }}
              animate={{ x: '250%', opacity: 0 }}
              transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: '45%',
                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.75) 50%, transparent 100%)',
                pointerEvents: 'none',
                zIndex: 4,
              }}
            />

            {/* Ligne d'accent lumineuse supérieure avec déploiement fluide */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                transformOrigin: 'left',
                background: 'linear-gradient(90deg, #D4607E 0%, #F0A8BC 50%, #B87EC0 100%)',
                zIndex: 2,
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '8px',
                  background: 'rgba(212, 96, 126, 0.12)',
                  color: '#D4607E',
                }}>
                  <Sparkles size={13} />
                </span>
                <span style={{
                  fontSize: '0.74rem',
                  color: '#3B1529',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 800,
                }}>
                  Cycle & Bien-être
                </span>
              </div>
              {!showCycleForm && (
                <motion.button
                  onClick={openCycleForm}
                  whileHover={{ scale: 1.03, background: 'rgba(212, 96, 126, 0.14)' }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    background: 'rgba(212, 96, 126, 0.08)',
                    border: '1px solid rgba(212, 96, 126, 0.2)',
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#D4607E',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 1px 3px rgba(212, 96, 126, 0.08)',
                  }}
                >
                  <Pencil size={11} />
                  <span>{cycle ? 'Modifier' : 'Configurer'}</span>
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
                  style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
                >
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#8A4B6B', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Début du dernier cycle
                    </label>
                    <input
                      type="date"
                      value={cycleForm.startDate}
                      onChange={e => setCycleForm(f => ({ ...f, startDate: e.target.value }))}
                      style={{
                        ...inputStyle,
                        background: '#FFFFFF',
                        border: '1.5px solid rgba(240, 212, 228, 0.9)',
                        borderRadius: '12px',
                        fontSize: '0.84rem',
                        color: '#3B1529',
                        padding: '8px 12px',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.72rem', color: '#8A4B6B', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Durée cycle (j)
                      </label>
                      <input
                        type="number"
                        min={20}
                        max={45}
                        value={cycleForm.cycleLength}
                        onChange={e => setCycleForm(f => ({ ...f, cycleLength: e.target.value }))}
                        style={{
                          ...inputStyle,
                          background: '#FFFFFF',
                          border: '1.5px solid rgba(240, 212, 228, 0.9)',
                          borderRadius: '12px',
                          fontSize: '0.84rem',
                          color: '#3B1529',
                          padding: '8px 12px',
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.72rem', color: '#8A4B6B', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Règles (j)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={cycleForm.periodDuration}
                        onChange={e => setCycleForm(f => ({ ...f, periodDuration: e.target.value }))}
                        style={{
                          ...inputStyle,
                          background: '#FFFFFF',
                          border: '1.5px solid rgba(240, 212, 228, 0.9)',
                          borderRadius: '12px',
                          fontSize: '0.84rem',
                          color: '#3B1529',
                          padding: '8px 12px',
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <motion.button
                      onClick={handleSaveCycle}
                      whileTap={{ scale: 0.96 }}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        flex: 1, padding: '9px 14px',
                        background: 'radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.28) 0%, transparent 70%), #D4607E',
                        color: '#FFFFFF',
                        border: 'none', borderRadius: '12px', cursor: 'pointer',
                        fontSize: '0.8rem', fontFamily: 'inherit', fontWeight: 700,
                        boxShadow: '0 4px 14px rgba(212, 96, 126, 0.35)',
                      }}
                    >
                      Enregistrer
                    </motion.button>
                    <motion.button
                      onClick={() => setShowCycleForm(false)}
                      whileTap={{ scale: 0.96 }}
                      whileHover={{ scale: 1.02, background: 'rgba(212, 96, 126, 0.08)' }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        padding: '9px 14px',
                        background: 'transparent', color: '#8A4B6B',
                        border: '1px solid rgba(240, 212, 228, 0.9)', borderRadius: '12px', cursor: 'pointer',
                        fontSize: '0.8rem', fontFamily: 'inherit', fontWeight: 600,
                      }}
                    >
                      Annuler
                    </motion.button>
                    {cycle && (
                      <motion.button
                        onClick={async () => { await deleteCycle(); setShowCycleForm(false); }}
                        whileTap={{ scale: 0.96 }}
                        whileHover={{ scale: 1.02, background: 'rgba(239, 68, 68, 0.08)' }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          padding: '9px 12px',
                          background: 'transparent', color: '#EF4444',
                          border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px', cursor: 'pointer',
                          fontSize: '0.8rem', fontFamily: 'inherit', fontWeight: 600,
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

          {/* Connected Vertical Timeline */}
          <div style={{ position: 'relative', marginTop: '14px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--stone)', fontSize: '0.85rem' }}>
                Chargement…
              </div>
            ) : selectedEvents.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                style={{
                  textAlign: 'center',
                  padding: '32px 16px',
                  borderRadius: '16px',
                  background: 'var(--cream)',
                  border: '1px dashed var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--warm-white)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--stone)',
                }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--ink)' }}>
                    Journée libre
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--stone)', marginTop: '2px' }}>
                    Aucun événement planifié
                  </div>
                </div>
                <motion.button
                  onClick={openAddForm}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    marginTop: '4px',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--warm-white)',
                    color: 'var(--ink)',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Plus size={12} />
                  Ajouter un créneau
                </motion.button>
              </motion.div>
            ) : (
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Ligne directrice de la timeline */}
                <div className="agenda-timeline-connector" />

                <AnimatePresence mode="popLayout">
                  {selectedEvents.map((event, i) => {
                    const endTime = formatEndTime(event.time, event.duration);
                    return (
                      <motion.div
                        key={event.id}
                        layout
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -16, scale: 0.95, transition: { duration: 0.2, ease: 'easeOut' } }}
                        transition={{
                          duration: 0.3,
                          delay: Math.min(i * 0.04, 0.2),
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        style={{
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          zIndex: 1,
                        }}
                      >
                        {/* Puce lumineuse Timeline */}
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: event.color,
                            boxShadow: `0 0 0 3px var(--card, var(--warm-white)), 0 0 8px ${event.color}88`,
                            marginTop: '14px',
                            flexShrink: 0,
                          }}
                        />

                        {/* Carte de l'événement */}
                        <motion.div
                          whileHover={{
                            y: -2,
                            boxShadow: `0 8px 20px rgba(15, 23, 42, 0.08), 0 0 0 1px ${event.color}44`,
                          }}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            position: 'relative',
                            background: `radial-gradient(ellipse at 0% 0%, ${event.color}14 0%, transparent 70%), var(--card, var(--warm-white))`,
                            borderRadius: '14px',
                            padding: '12px 14px',
                            border: '1px solid var(--border)',
                            borderLeft: `3px solid ${event.color}`,
                            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                            transition: 'border-color 0.2s ease, box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                            overflow: 'hidden',
                          }}
                        >
                          {/* Barre d'info supérieure */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexWrap: 'wrap' }}>
                              {/* Badge horaire */}
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: 'var(--ink)',
                                background: 'var(--cream)',
                                padding: '2px 6px',
                                borderRadius: '6px',
                                border: '1px solid var(--border)',
                              }}>
                                <Clock size={11} style={{ color: event.color }} />
                                {event.time} {endTime ? `– ${endTime}` : ''}
                              </span>

                              {/* Catégorie */}
                              <span style={{
                                fontSize: '0.64rem',
                                fontWeight: 700,
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                color: 'var(--stone)',
                                background: 'var(--warm-white)',
                                padding: '2px 6px',
                                borderRadius: '6px',
                              }}>
                                {event.category}
                              </span>

                              {event.recurrence !== 'none' && (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  fontSize: '0.62rem',
                                  color: 'var(--stone)',
                                  background: 'var(--warm-white)',
                                  padding: '1px 5px',
                                  borderRadius: '5px',
                                  border: '1px solid var(--border)',
                                }}>
                                  <Repeat size={9} />
                                  {RECURRENCE_LABELS[event.recurrence]}
                                </span>
                              )}
                            </div>

                            {/* Actions rapides */}
                            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                              <motion.button
                                onClick={() => openEditForm(event)}
                                title="Modifier l'événement"
                                whileTap={{ scale: 0.92 }}
                                whileHover={{ scale: 1.08, background: 'var(--muted)' }}
                                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                                style={{
                                  padding: '4px 6px',
                                  borderRadius: '7px',
                                  border: '1px solid var(--border)',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  color: 'var(--stone)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                }}
                              >
                                <Pencil size={12} />
                              </motion.button>
                              <motion.button
                                onClick={() => handleDelete(event)}
                                title="Supprimer l'événement"
                                whileTap={{ scale: 0.92 }}
                                whileHover={{ scale: 1.08, background: 'var(--priority-high-bg)' }}
                                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                                style={{
                                  padding: '4px 6px',
                                  borderRadius: '7px',
                                  border: '1px solid var(--border)',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  color: 'var(--priority-high)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                }}
                              >
                                <Trash size={12} color="var(--priority-high)" />
                              </motion.button>
                            </div>
                          </div>

                          {/* Titre */}
                          <TextReveal delay={0.04 + Math.min(i * 0.03, 0.15)} duration={0.35}>
                            <div
                              style={{
                                fontSize: '0.88rem',
                                fontWeight: 600,
                                color: 'var(--ink)',
                                lineHeight: 1.35,
                                letterSpacing: '-0.01em',
                              }}
                            >
                              {event.title}
                            </div>
                          </TextReveal>

                          {/* Durée */}
                          <div style={{ fontSize: '0.68rem', color: 'var(--stone)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>Durée : {event.duration}</span>
                          </div>
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
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
      background: 'var(--warm-white)', borderRadius: '24px',
      overflow: 'hidden',
    }}>
      {/* Weekday headers avec descente fluide */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          borderBottom: '1px solid var(--border)',
          background: 'var(--cream)',
        }}
      >
        {weekDayLabels.map(d => (
          <div key={d} style={{
            padding: '12px 0', textAlign: 'center',
            fontSize: '0.72rem', color: 'var(--stone)',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            fontWeight: 700,
          }}>{d}</div>
        ))}
      </motion.div>

      {/* Days */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(100px, 1fr)' }}>
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} style={{ borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.01)' }} />
        ))}
        {days.map((day, dayIdx) => {
          const dayEvents = events.filter(e => isSameDay(startOfDay(e.date), startOfDay(day)));
          const selected = isSameDay(day, selectedDate);
          const today = isToday(day);
          const cycleDay = cycleDays.find(cd => isSameDay(startOfDay(cd.date), startOfDay(day)));
          const cycleBg = cycleDay?.type === 'period' ? 'rgba(212, 96, 126, 0.08)'
            : cycleDay?.type === 'predicted-period' ? 'rgba(212, 96, 126, 0.05)'
            : undefined;
          return (
            <motion.div
              key={day.toString()}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.28, delay: Math.min(dayIdx * 0.007, 0.22), ease: [0.16, 1, 0.3, 1] }}
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <motion.div
                  initial={today ? { scale: 0.7, opacity: 0 } : undefined}
                  animate={today ? { scale: 1, opacity: 1 } : undefined}
                  transition={today ? { type: 'spring', stiffness: 380, damping: 18, delay: 0.22 } : undefined}
                  style={{
                    width: '26px', height: '26px',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.78rem',
                    background: today ? 'var(--primary-btn-bg, var(--ink))' : selected ? 'var(--accent-soft)' : 'transparent',
                    color: today ? 'var(--primary-btn-fg, #ffffff)' : selected ? 'var(--accent)' : 'var(--ink)',
                    fontWeight: today ? 700 : selected ? 700 : 500,
                    boxShadow: today ? '0 2px 6px var(--primary-btn-shadow, rgba(15,23,42,0.15))' : undefined,
                    border: selected && !today ? '1px solid var(--accent)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {format(day, 'd')}
                </motion.div>
                {(cycleDay?.type === 'period' || cycleDay?.type === 'predicted-period') && (
                  <div
                    title={cycleDay.type === 'period' ? 'Règles' : 'Prévision règles'}
                    style={{
                      width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                      background: '#D4607E',
                      boxShadow: '0 0 6px rgba(212, 96, 126, 0.6)',
                    }}
                  />
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
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        fontSize: '0.67rem',
                        padding: '3px 6px',
                        borderRadius: '7px',
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
                    fontWeight: 700,
                    color: 'var(--stone)',
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    background: 'var(--warm-white)',
                    border: '1px solid var(--border)',
                    alignSelf: 'flex-start',
                    marginTop: '1px',
                  }}>
                    +{dayEvents.length - 2} autre{dayEvents.length - 2 > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Week grid ────────────────────────────────────────────────────────────────

const HOUR_HEIGHT = 54; // px per hour row

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
  const [nowDate, setNowDate] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNowDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const todayIndex = weekDays.findIndex(d => isSameDay(d, nowDate));
  const currentHour = nowDate.getHours();
  const currentMinute = nowDate.getMinutes();
  const showNowIndicator = todayIndex !== -1 && currentHour >= 8 && currentHour < 24;
  const nowTopPx = (currentHour - 8) * HOUR_HEIGHT + currentMinute * (HOUR_HEIGHT / 60);

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
      background: 'var(--warm-white)', borderRadius: '24px',
      overflow: 'hidden',
    }}>
      {/* Day headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '48px repeat(7, 1fr)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--warm-white)',
      }}>
        <div style={{ borderRight: '1px solid var(--border)', background: 'var(--cream)' }} />
        {weekDays.map(day => {
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
                padding: '10px 4px',
                textAlign: 'center',
                cursor: 'pointer',
                borderRight: '1px solid var(--border)',
                background: selected ? 'var(--accent-soft)' : cycleBg ?? 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <div style={{
                fontSize: '0.68rem',
                color: today ? 'var(--accent)' : 'var(--stone)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: today || selected ? 700 : 500,
              }}>
                {format(day, 'EEE', { locale: fr })}
              </div>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.82rem', margin: '3px auto 0',
                background: today ? 'var(--primary-btn-bg, var(--ink))' : 'transparent',
                color: today ? 'var(--primary-btn-fg, #ffffff)' : selected ? 'var(--accent)' : 'var(--ink)',
                fontWeight: today ? 700 : selected ? 700 : 500,
                border: selected && !today ? '1px solid var(--accent)' : 'none',
                boxShadow: today ? '0 2px 6px var(--primary-btn-shadow, rgba(15,23,42,0.15))' : undefined,
              }}>
                {format(day, 'd')}
              </div>
              {(cycleDay?.type === 'period' || cycleDay?.type === 'predicted-period') && (
                <div style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  margin: '2px auto 0', flexShrink: 0,
                  background: '#D4607E',
                  boxShadow: '0 0 5px rgba(212, 96, 126, 0.6)',
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
        {/* Now Indicator line & dot */}
        {showNowIndicator && (
          <div
            style={{
              position: 'absolute',
              top: `${nowTopPx}px`,
              left: `calc(48px + ${todayIndex} * ((100% - 48px) / 7))`,
              width: 'calc((100% - 48px) / 7)',
              zIndex: 8,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#EF4444',
                boxShadow: '0 0 8px #EF4444, 0 0 2px #EF4444',
                marginLeft: '-4px',
                flexShrink: 0,
              }}
            />
            <div
              style={{
                flex: 1,
                height: '2px',
                background: '#EF4444',
                boxShadow: '0 0 4px rgba(239, 68, 68, 0.6)',
              }}
            />
          </div>
        )}

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
                            height: `${blockHeight}px`,
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
  const today = startOfDay(new Date());
  const start = startOfDay(cycle.startDate);
  const diff = differenceInDays(today, start);
  const cycleLen = Math.max(cycle.cycleLength, 20);
  const periodLen = Math.max(cycle.periodDuration, 1);

  // Position dans le cycle actuel (0-indexé)
  const dayInCycle = ((diff % cycleLen) + cycleLen) % cycleLen;
  const currentDay = dayInCycle + 1; // 1 à cycleLen
  const daysRemaining = daysUntilNextPeriod(cycle);

  // Date estimée des prochaines règles
  const nextPeriodDate = addDays(today, daysRemaining === 0 ? cycleLen : daysRemaining);
  const formattedNextDate = format(nextPeriodDate, 'd MMMM', { locale: fr });

  // Ovulation & fertilité
  const ovulationDay = Math.max(cycleLen - 14, 1);
  const fertileStart = Math.max(ovulationDay - 3, periodLen);
  const fertileEnd = Math.min(ovulationDay + 2, cycleLen - 1);

  // Détermination de la phase actuelle
  let phase: {
    name: string;
    label: string;
    sub: string;
    icon: string;
    color: string;
    bg: string;
  };

  if (dayInCycle < periodLen) {
    phase = {
      name: 'Menstruation',
      label: 'Phase des règles',
      sub: `Jour ${currentDay} sur ${periodLen} de flux`,
      icon: '🩸',
      color: '#D4607E',
      bg: 'rgba(212, 96, 126, 0.12)',
    };
  } else if (dayInCycle < fertileStart) {
    phase = {
      name: 'Folliculaire',
      label: 'Phase folliculaire',
      sub: 'Regain d’énergie & créativité',
      icon: '🌱',
      color: '#D483A0',
      bg: 'rgba(212, 131, 160, 0.12)',
    };
  } else if (dayInCycle <= fertileEnd) {
    phase = {
      name: 'Fertilité / Ovulation',
      label: dayInCycle === ovulationDay ? 'Jour d’ovulation ✨' : 'Fenêtre fertile',
      sub: dayInCycle === ovulationDay ? 'Pic d’ovulation aujourd’hui' : 'Probabilité de fertilité haute',
      icon: '✨',
      color: '#B87EC0',
      bg: 'rgba(184, 126, 192, 0.15)',
    };
  } else {
    phase = {
      name: 'Lutéale',
      label: 'Phase lutéale',
      sub: 'Ralentissement doux & écoute',
      icon: '🌙',
      color: '#8A4B6B',
      bg: 'rgba(138, 75, 107, 0.12)',
    };
  }

  // Pourcentage global du cycle
  const overallCyclePercent = Math.min(Math.max(Math.round((currentDay / cycleLen) * 100), 1), 100);

  // SVG Circular Gauge calculations
  const radius = 25;
  const circumference = 2 * Math.PI * radius; // ~157.08
  const strokeDashoffset = circumference - (overallCyclePercent / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* ── Bloc Héros : Chiffre & Jauge circulaire avec animation d'apparition ── */}
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '12px 14px',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.7)',
          border: '1px solid rgba(240, 212, 228, 0.7)',
          boxShadow: '0 2px 8px rgba(212, 96, 126, 0.04)',
        }}
      >
        <div style={{ flex: 1 }}>
          {/* Badge Phase Actuelle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              borderRadius: '999px',
              background: phase.bg,
              color: phase.color,
              fontSize: '0.68rem',
              fontWeight: 700,
              marginBottom: '6px',
            }}
          >
            <span style={{ fontSize: '0.72rem' }}>{phase.icon}</span>
            <span>{phase.label}</span>
          </motion.div>

          {/* Nombre principal avec typographie moderne */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <motion.span
              key={daysRemaining}
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 20, delay: 0.24 }}
              className="font-display"
              style={{
                fontSize: '2.1rem',
                fontWeight: 800,
                color: '#3B1529',
                lineHeight: 1,
                letterSpacing: '-0.03em',
              }}
            >
              {daysRemaining === 0 ? 'Jour J' : daysRemaining}
            </motion.span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3B1529', lineHeight: 1.2 }}>
              {daysRemaining === 0
                ? 'Nouveau cycle aujourd’hui'
                : `jour${daysRemaining > 1 ? 's' : ''} avant le prochain cycle`}
            </span>
          </div>

          <div style={{ fontSize: '0.7rem', color: '#8A4B6B', marginTop: '4px', fontWeight: 500 }}>
            {daysRemaining === 0
              ? 'Premier jour des règles estimé'
              : `Prévu vers le ${formattedNextDate} · Jour ${currentDay}/${cycleLen}`}
          </div>
        </div>

        {/* Jauge circulaire élégante */}
        <div style={{
          position: 'relative',
          width: '60px',
          height: '60px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="30"
              cy="30"
              r={radius}
              fill="transparent"
              stroke="rgba(212, 96, 126, 0.14)"
              strokeWidth="4.5"
            />
            <motion.circle
              cx="30"
              cy="30"
              r={radius}
              fill="transparent"
              stroke={phase.color}
              strokeWidth="4.5"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
              strokeLinecap="round"
            />
          </svg>
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#3B1529', lineHeight: 1 }}>
              J.{currentDay}
            </span>
            <span style={{ fontSize: '0.55rem', fontWeight: 600, color: '#8A4B6B', marginTop: '1px' }}>
              /{cycleLen}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Frise Chronologique Segmentée des 4 Phases ── */}
      <motion.div
        initial={{ opacity: 0, y: 10, scaleX: 0.95 }}
        animate={{ opacity: 1, y: 0, scaleX: 1 }}
        transition={{ duration: 0.55, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'flex', flexDirection: 'column', gap: '6px', transformOrigin: 'left' }}
      >
        {/* Barre de progression segmentée */}
        <div style={{
          width: '100%',
          height: '8px',
          borderRadius: '999px',
          background: 'rgba(212, 96, 126, 0.1)',
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Phase 1 : Règles */}
          <div
            title={`Règles (j 1 à ${periodLen})`}
            style={{
              width: `${(periodLen / cycleLen) * 100}%`,
              background: '#D4607E',
              opacity: dayInCycle < periodLen ? 1 : 0.4,
              transition: 'opacity 0.2s ease',
            }}
          />
          {/* Phase 2 : Folliculaire */}
          <div
            title={`Folliculaire (j ${periodLen + 1} à ${fertileStart - 1})`}
            style={{
              width: `${(Math.max(0, fertileStart - periodLen) / cycleLen) * 100}%`,
              background: '#EAA8B8',
              opacity: dayInCycle >= periodLen && dayInCycle < fertileStart ? 1 : 0.4,
              transition: 'opacity 0.2s ease',
            }}
          />
          {/* Phase 3 : Fertile / Ovulation */}
          <div
            title={`Fertile & Ovulation (j ${fertileStart} à ${fertileEnd})`}
            style={{
              width: `${((fertileEnd - fertileStart + 1) / cycleLen) * 100}%`,
              background: '#B87EC0',
              opacity: dayInCycle >= fertileStart && dayInCycle <= fertileEnd ? 1 : 0.4,
              transition: 'opacity 0.2s ease',
            }}
          />
          {/* Phase 4 : Lutéale */}
          <div
            title={`Lutéale (j ${fertileEnd + 1} à ${cycleLen})`}
            style={{
              flex: 1,
              background: '#8A4B6B',
              opacity: dayInCycle > fertileEnd ? 1 : 0.4,
              transition: 'opacity 0.2s ease',
            }}
          />

          {/* Curseur dynamique indiquant aujourd'hui avec rebond printanier */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 18, delay: 0.48 }}
            style={{
              position: 'absolute',
              top: '50%',
              left: `${Math.min(Math.max((dayInCycle / (cycleLen - 1)) * 100, 2), 98)}%`,
              transform: 'translate(-50%, -50%)',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#FFFFFF',
              border: `2px solid ${phase.color}`,
              boxShadow: `0 0 6px ${phase.color}`,
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
        </div>

        {/* Labels des 4 phases */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.64rem',
          color: '#8A4B6B',
          fontWeight: 600,
          padding: '0 2px',
        }}>
          <span style={{ color: dayInCycle < periodLen ? '#D4607E' : '#8A4B6B', fontWeight: dayInCycle < periodLen ? 800 : 600 }}>
            • Règles
          </span>
          <span style={{ color: dayInCycle >= periodLen && dayInCycle < fertileStart ? '#D483A0' : '#8A4B6B', fontWeight: dayInCycle >= periodLen && dayInCycle < fertileStart ? 800 : 600 }}>
            • Folliculaire
          </span>
          <span style={{ color: dayInCycle >= fertileStart && dayInCycle <= fertileEnd ? '#B87EC0' : '#8A4B6B', fontWeight: dayInCycle >= fertileStart && dayInCycle <= fertileEnd ? 800 : 600 }}>
            • Ovulation
          </span>
          <span style={{ color: dayInCycle > fertileEnd ? '#8A4B6B' : '#B898A8', fontWeight: dayInCycle > fertileEnd ? 800 : 600 }}>
            • Lutéale
          </span>
        </div>
      </motion.div>

      {/* ── Badges Récapitulatifs Satinés en cascade ── */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {[
          { icon: '🩸', label: `Règles : ${cycle.periodDuration}j`, bg: 'rgba(212, 96, 126, 0.1)', border: 'rgba(212, 96, 126, 0.18)', color: '#D4607E' },
          { icon: '🌸', label: `Cycle : ${cycle.cycleLength}j`, bg: 'rgba(184, 126, 192, 0.12)', border: 'rgba(184, 126, 192, 0.2)', color: '#8A4B6B' },
          { icon: '✨', label: `Ovulation : J.${ovulationDay}`, bg: 'rgba(212, 131, 160, 0.1)', border: 'rgba(212, 131, 160, 0.18)', color: '#D483A0' },
        ].map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.38 + idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '10px',
              background: item.bg,
              border: `1px solid ${item.border}`,
              color: item.color,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
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
