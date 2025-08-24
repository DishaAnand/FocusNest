// hooks/useProgress.ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import {
  getDayTotals,
  getRangeTotals,
  PROGRESS_UPDATED_EVENT,
} from '../storage/progressStore';
import {
  addDays, addMonths, endOfMonth, endOfWeekSun, monthName,
  startOfMonth, startOfWeekSun, toISODate, weekdayShort
} from '../utils/date';
import { getSessionsInRange } from '../storage/sessionStore';

export type ViewMode = 'Daily' | 'Weekly' | 'Monthly';

export function useProgress() {
  const [mode, setMode] = useState<ViewMode>('Daily');
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [summary, setSummary] = useState({ focus: 0, break: 0 }); // seconds
  const [series, setSeries] = useState<{ label: string; value: number; date: string }[]>([]); // value in seconds

  // NEW: focus session stats for the active window
  const [stats, setStats] = useState({
    sessionsCompleted: 0,
    avgSession: 0,      // seconds
    longestSession: 0,  // seconds
  });

  const title = useMemo(() => {
    const todayKey = toISODate(new Date());
    const anchorKey = toISODate(anchor);
    if (mode === 'Daily') {
      if (anchorKey === todayKey) return 'Today';
      if (toISODate(addDays(new Date(), -1)) === anchorKey) return 'Yesterday';
      return anchor.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    }
    if (mode === 'Weekly') {
      const s = startOfWeekSun(anchor);
      const e = endOfWeekSun(anchor);
      return `${s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    }
    return `${monthName(anchor)} ${anchor.getFullYear()}`;
  }, [mode, anchor]);

  const load = useCallback(async () => {
    if (mode === 'Daily') {
      // summary for the anchor day
      const dayKey = toISODate(anchor);
      const t = await getDayTotals(dayKey);
      setSummary(t);

      // chart shows the week containing the anchor
      const s = startOfWeekSun(anchor);
      const e = endOfWeekSun(anchor);
      const range = await getRangeTotals(s, e);
      setSeries(range.map((r, i) => ({
        label: weekdayShort[i],
        value: r.focus, // seconds (you convert to minutes in the Daily chart)
        date: r.date,
      })));

      // stats for the anchor day
      const dayStart = startOfDay(anchor);
      const dayEnd = endOfDay(anchor);
      const sessions = await getSessionsInRange(dayStart, dayEnd);
      const focusSessions = sessions.filter(s0 => s0.kind === 'focus');
      const count = focusSessions.length;
      const total = focusSessions.reduce((a, b) => a + b.seconds, 0);
      const longest = focusSessions.reduce((a, b) => Math.max(a, b.seconds), 0);
      setStats({
        sessionsCompleted: count,
        avgSession: count ? Math.round(total / count) : 0,
        longestSession: longest,
      });
      return;
    }

    if (mode === 'Weekly') {
      const s = startOfWeekSun(anchor);
      const e = endOfWeekSun(anchor);
      const range = await getRangeTotals(s, e);
      const focus = range.reduce((a, r) => a + r.focus, 0);
      const brk = range.reduce((a, r) => a + r.break, 0);
      setSummary({ focus, break: brk });
      setSeries(range.map((r, i) => ({
        label: weekdayShort[i],
        value: r.focus,
        date: r.date,
      })));

      // stats for the week (focus sessions only)
      const sessions = await getSessionsInRange(s, e);
      const focusSessions = sessions.filter(s0 => s0.kind === 'focus');
      const count = focusSessions.length;
      const total = focusSessions.reduce((a, b) => a + b.seconds, 0);
      const longest = focusSessions.reduce((a, b) => Math.max(a, b.seconds), 0);
      setStats({
        sessionsCompleted: count,
        avgSession: count ? Math.round(total / count) : 0,
        longestSession: longest,
      });
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

    // stats for the month (focus sessions only)
    const sessions = await getSessionsInRange(s, endOfDay(e));
    const focusSessions = sessions.filter(s0 => s0.kind === 'focus');
    const count = focusSessions.length;
    const total = focusSessions.reduce((a, b) => a + b.seconds, 0);
    const longest = focusSessions.reduce((a, b) => Math.max(a, b.seconds), 0);
    setStats({
      sessionsCompleted: count,
      avgSession: count ? Math.round(total / count) : 0,
      longestSession: longest,
    });
  }, [mode, anchor]);

  useEffect(() => { load(); }, [load]);

  // refresh when Timer logs a session or day totals change
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
    if (!canGoNext) return;
    if (mode === 'Daily') setAnchor(a => addDays(a, +1));
    else if (mode === 'Weekly') setAnchor(a => addDays(a, +7));
    else setAnchor(a => addMonths(a, +1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const canGoNext = useMemo(() => {
    const today = toISODate(new Date());
    if (mode === 'Daily') return toISODate(addDays(anchor, 1)) <= today;
    if (mode === 'Weekly') return toISODate(addDays(endOfWeekSun(anchor), 1)) <= today;
    return toISODate(addDays(endOfMonth(anchor), 1)) <= today;
  }, [mode, anchor]);

  return { mode, setMode, anchor, title, summary, series, stats, goPrev, goNext, canGoNext };
}

// locals
function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0); }
function endOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999); }
