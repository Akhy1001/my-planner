'use client';
import { useState, useEffect } from 'react';
import { format, parseISO, addDays, startOfDay, differenceInDays } from 'date-fns';
import { supabase } from '@/lib/supabase';

export interface MenstrualCycle {
  startDate: Date;
  cycleLength: number;
  periodDuration: number;
}

export type CycleDayType = 'period' | 'fertile' | 'predicted-period' | 'cycle';

export interface CycleDay {
  date: Date;
  type: CycleDayType;
}

interface DbCycle {
  id: string;
  user_id: string;
  start_date: string;
  cycle_length: number;
  period_duration: number;
  updated_at: string;
}

/** Calcule les jours de cycle pour une plage de dates donnée.
 *  Itère jour par jour et calcule la position dans le cycle via modulo.
 */
export function computeCycleDays(cycle: MenstrualCycle, rangeStart: Date, rangeEnd: Date): CycleDay[] {
  const result: CycleDay[] = [];
  const start = startOfDay(cycle.startDate);
  const today = startOfDay(new Date());

  // Ovulation au jour (cycleLength - 14) depuis le début du cycle (0-indexé)
  const ovulationOffset = cycle.cycleLength - 14;

  let current = startOfDay(rangeStart);
  const end = startOfDay(rangeEnd);

  while (current <= end) {
    const diff = differenceInDays(current, start);
    // Position dans le cycle, toujours positive (0-indexé)
    const dayInCycle = ((diff % cycle.cycleLength) + cycle.cycleLength) % cycle.cycleLength;
    // Début du cycle auquel appartient ce jour
    const cycleStartOffset = diff - dayInCycle;
    const isFutureCycle = cycleStartOffset > 0 && addDays(start, cycleStartOffset) > today;

    let type: CycleDayType;
    if (dayInCycle < cycle.periodDuration) {
      type = isFutureCycle ? 'predicted-period' : 'period';
    } else if (dayInCycle >= ovulationOffset - 2 && dayInCycle <= ovulationOffset + 2) {
      type = 'fertile';
    } else {
      type = 'cycle';
    }

    result.push({ date: current, type });
    current = addDays(current, 1);
  }

  return result;
}

/** Retourne le nombre de jours avant le prochain cycle prévu */
export function daysUntilNextPeriod(cycle: MenstrualCycle): number {
  const today = startOfDay(new Date());
  const start = startOfDay(cycle.startDate);
  const diff = differenceInDays(today, start);
  const dayInCycle = ((diff % cycle.cycleLength) + cycle.cycleLength) % cycle.cycleLength;
  const remaining = cycle.cycleLength - dayInCycle;
  return remaining === cycle.cycleLength ? 0 : remaining;
}

export function useMenstrualCycle() {
  const [cycle, setCycle] = useState<MenstrualCycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    const fetchCycle = async () => {
      const { data, error } = await supabase
        .from('menstrual_cycles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (!error && data) {
        const db = data as DbCycle;
        setCycle({
          startDate: startOfDay(parseISO(db.start_date)),
          cycleLength: db.cycle_length,
          periodDuration: db.period_duration,
        });
      }
      setLoading(false);
    };
    fetchCycle();
  }, [userId]);

  const saveCycle = async (fields: MenstrualCycle) => {
    if (!userId) return;
    const payload = {
      user_id: userId,
      start_date: format(fields.startDate, 'yyyy-MM-dd'),
      cycle_length: fields.cycleLength,
      period_duration: fields.periodDuration,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('menstrual_cycles')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();
    if (!error && data) {
      const db = data as DbCycle;
      setCycle({
        startDate: startOfDay(parseISO(db.start_date)),
        cycleLength: db.cycle_length,
        periodDuration: db.period_duration,
      });
    }
  };

  const deleteCycle = async () => {
    if (!userId) return;
    await supabase.from('menstrual_cycles').delete().eq('user_id', userId);
    setCycle(null);
  };

  return { cycle, loading, saveCycle, deleteCycle };
}
