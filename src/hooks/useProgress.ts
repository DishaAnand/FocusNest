// hooks/useProgress.ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import {
  getDayTotals,
  getRangeTotals,
  PROGRESS_UPDATED_EVENT, // make sure it's exported from progressStore
} from '../storage/progressStore';
import { getSessionStatsInRange } from '../storage/sessionStore';
import {
  addDays, addMonths, endOfMonth, monthName, startOfMonth,
  toISODate,
} from '../utils/date';

export type ViewMode = 'Daily' | 'Weekly' | 'Monthly';

type SeriesPoint = { label: string; value: number; date: string };

function startOfWeekMon(d: Date) {
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7; // Mon=0, Tue=1, ... Sun=6
  const out = new Date(d);
  out.setDate(d.getDate() - diff);
  out.setHours(0, 0, 0, 0);
  return out;
}
function endOfWeekMon(d: Date) {
  const s = startOfWeekMon(d);
  const e = new Date(s);
  e.setDate(s.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}
const weekdayShortMon = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function useProgress() {
  const [mode, setMode] = useState<ViewMode>('Daily');
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [summary, setSummary] = useState({ focus: 0, break: 0 }); // seconds
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [stats, setStats] = useState({ sessionsCompleted: 0, avgSession: 0, longestSession: 0 });

  const title = useMemo(() => {
    const todayKey = toISODate(new Date());
    const anchorKey = toISODate(anchor);
    if (mode === 'Daily') {
      if (anchorKey === todayKey) return 'Today';
      if (toISODate(addDays(new Date(), -1)) === anchorKey) return 'Yesterday';
      return anchor.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    }
    if (mode === 'Weekly') {
      const s = startOfWeekMon(anchor);
      const e = endOfWeekMon(anchor);
      return `${s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    }
    return `${monthName(anchor)} ${anchor.getFullYear()}`;
  }, [mode, anchor]);

  const load = useCallback(async () => {
    if (mode === 'Daily') {
      const t = await getDayTotals(toISODate(anchor));
      setSummary(t);

      // for the chart: the *week* that contains the anchor, Mon→Sun
      const s = startOfWeekMon(anchor);
      const e = endOfWeekMon(anchor);
      const range = await getRangeTotals(s, e);
      setSeries(range.map((r, i) => ({
        label: weekdayShortMon[i],
        value: r.focus, // seconds
        date: r.date,
      })));

      // stats for just this day
      const dayStart = new Date(anchor); dayStart.setHours(0,0,0,0);
      const dayEnd = new Date(anchor); dayEnd.setHours(23,59,59,999);
      const st = await getSessionStatsInRange(dayStart, dayEnd);
      setStats(st);
      return;
    }

    if (mode === 'Weekly') {
      const s = startOfWeekMon(anchor);
      const e = endOfWeekMon(anchor);
      const range = await getRangeTotals(s, e);
      const focus = range.reduce((a, r) => a + r.focus, 0);
      const brk = range.reduce((a, r) => a + r.break, 0);
      setSummary({ focus, break: brk });
      setSeries(range.map((r, i) => ({
        label: weekdayShortMon[i],
        value: r.focus,
        date: r.date,
      })));

      // stats over the whole week
      const st = await getSessionStatsInRange(s, e);
      setStats(st);
      return;
    }

    // Monthly
    const s = startOfMonth(anchor);
    const e = endOfMonth(anchor);
    const range = await getRangeTotals(s, e);
    const focus = range.reduce((a, r) => a + r.focus, 0);
    const brk = range.reduce((a, r) => a + r.break, 0);
    setSummary({ focus, break: brk });
    setSeries(range.map((r) => ({
      label: String(new Date(r.date).getDate()),
      value: r.focus,
      date: r.date,
    })));

    // stats over the month
    const st = await getSessionStatsInRange(s, e);
    setStats(st);
  }, [mode, anchor]);

  // initial + whenever mode/anchor change
  useEffect(() => { load(); }, [load]);

  // 🔔 live refresh when the timer writes progress
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(PROGRESS_UPDATED_EVENT, load);
    return () => sub.remove();
  }, [load]);

  // Navigation
  const goPrev = useCallback(() => {
    if (mode === 'Daily') setAnchor(a => addDays(a, -1));
    else if (mode === 'Weekly') setAnchor(a => addDays(a, -7));
    else setAnchor(a => addMonths(a, -1));
  }, [mode]);

  const goNext = useCallback(() => {
    const next = new Date(anchor);
    if (mode === 'Daily') next.setDate(anchor.getDate() + 1);
    else if (mode === 'Weekly') next.setDate(anchor.getDate() + 7);
    else next.setMonth(anchor.getMonth() + 1);

    // prevent moving into future windows
    const todayISO = toISODate(new Date());
    const limitISO =
      mode === 'Daily'
        ? toISODate(next)
        : mode === 'Weekly'
        ? toISODate(addDays(endOfWeekMon(next), 0))
        : toISODate(addDays(endOfMonth(next), 0));

    if (limitISO <= todayISO) setAnchor(next);
  }, [mode, anchor]);

  const canGoNext = useMemo(() => {
    const today = toISODate(new Date());
    if (mode === 'Daily') return toISODate(addDays(anchor, 1)) <= today;
    if (mode === 'Weekly') return toISODate(addDays(endOfWeekMon(anchor), 1)) <= today;
    return toISODate(addDays(endOfMonth(anchor), 1)) <= today;
  }, [mode, anchor]);

  return { mode, setMode, anchor, title, summary, series, stats, goPrev, goNext, canGoNext };
}
