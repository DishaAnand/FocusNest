// screens/ProgressScreen.tsx
import React from 'react';
import { View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './ProgressScreen.styles';
import SegmentedTabs from '../components/SegmentedTabs';
import SingleDayBarChart from '../components/SingleDayBarChart';
import WeeklyFocusChart from '../components/WeeklyStackedChart';
import MonthlyFocusChart from '../components/MonthlyFocusChart';
import StatsList from '../components/StatsList';
import { useProgress } from '../hooks/useProgress';
import { toISODate } from '../utils/date';
import { secsToWholeMinutes } from '../utils/time';
import { clearAllProgress } from '../storage/progressStore';
import { clearAllSessions } from '../storage/sessionStore';

// helper: floor seconds → whole minutes (never negative)
const toWholeMinutes = (sec: number) => Math.max(0, Math.floor(sec / 60));

export default function ProgressScreen() {
  const {
    mode,
    setMode,
    anchor,
    title,
    summary,
    series,
    stats,
    goPrev,
    goNext,
    canGoNext,
  } = useProgress();

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const pagePadH = Math.max(16, Math.min(24, Math.round(width * 0.05)));
  const topGap = Math.max(16, insets.top + 12);
  const chartWidth = Math.max(300, Math.min(520, width - pagePadH * 2));

  const overviewHeading =
    mode === 'Daily' ? 'TODAY OVERVIEW' : mode === 'Weekly' ? 'THIS WEEK OVERVIEW' : 'THIS MONTH OVERVIEW';

  // ───────────────────────── helpers for MONTHLY fixed day buckets ─────────────────────────
  const daysInMonth = (y: number, mZeroBased: number) => new Date(y, mZeroBased + 1, 0).getDate();
  const inRange = (d: number, lo: number, hi: number) => d >= lo && d <= hi;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F7F3' }}>
      <ScrollView
        style={[styles.container, { paddingHorizontal: pagePadH }]}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 28 }]}
      >
        {/* Segmented tray */}
        <View style={{ paddingTop: topGap, paddingBottom: 12, alignItems: 'center' }}>
          <View
            style={{
              borderRadius: 18,
              padding: 6,
              backgroundColor: '#f0e8e8ff',
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 2,
            }}
          >
            <SegmentedTabs
              tabs={['Daily', 'Weekly', 'Monthly']}
              value={mode}
              onChange={(v) => setMode(v as any)}
            />
          </View>
        </View>

        {/* Nav Row */}
        <View style={[styles.navRow, { marginTop: 8 }]}>
          <Pressable onPress={goPrev} style={styles.chevBtn}>
            <Text style={styles.chev}>{'‹'}</Text>
          </Pressable>
          <Text style={styles.title}>{title}</Text>
          <Pressable
            onPress={canGoNext ? goNext : undefined}
            style={[styles.chevBtn, !canGoNext && styles.chevDisabled]}
          >
            <Text style={styles.chev}>{'›'}</Text>
          </Pressable>
        </View>

        {/* Overview */}
        <View style={[styles.card, { marginTop: 10 }]}>
          <View style={styles.cardCol}>
            <Text style={styles.cardLabel}>{overviewHeading}</Text>
            <Text style={styles.subTitle}>Focus</Text>
            <Text style={styles.big}>{toWholeMinutes(summary.focus)} min</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.cardCol}>
            <Text style={styles.cardLabelHidden}>.</Text>
            <Text style={styles.subTitle}>Break</Text>
            <Text style={styles.big}>{toWholeMinutes(summary.break)} min</Text>
          </View>
        </View>

        {/* Chart */}
        <View style={{ alignSelf: 'center', width: chartWidth, marginTop: 16 }}>
          {mode === 'Daily' ? (
            <SingleDayBarChart
              minutes={secsToWholeMinutes(summary.focus)} // seconds → minutes (floor)
              label={anchor.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              color="#F46C6C"
            />
          ) : mode === 'Weekly' ? (
            <WeeklyFocusChart
              data={series.map((s) => {
                const [, mm, dd] = s.date.split('-'); // tz-safe
                return {
                  date: s.date,
                  label: `${mm}-${dd}`,
                  focusMin: secsToWholeMinutes(s.value), // seconds → minutes (floor)
                };
              })}
              todayISO={toISODate(new Date())}
              focusColor="#F46C6C"
            />
          ) : (
            // MONTHLY → fixed day buckets (01–07, 08–14, 15–21, 22–28, 29–end), focus-only
            <MonthlyFocusChart
              data={(() => {
                const year = anchor.getFullYear();
                const m0 = anchor.getMonth(); // 0-based
                const endDay = daysInMonth(year, m0);

                // Define ranges; clamp final bucket to month end, drop if empty
                const ranges: Array<{ lo: number; hi: number }> = [
                  { lo: 1,  hi: Math.min(7,  endDay) },
                  { lo: 8,  hi: Math.min(14, endDay) },
                  { lo: 15, hi: Math.min(21, endDay) },
                  { lo: 22, hi: Math.min(28, endDay) },
                  { lo: 29, hi: endDay },
                ].filter(r => r.lo <= r.hi);

                // Initialize bucket totals (minutes)
                const totals = ranges.map(() => 0);

                // Accumulate focus minutes for current month only
                for (const s of series) {
                  const [, mmStr, ddStr] = s.date.split('-'); // 'YYYY-MM-DD'
                  const mm = Number(mmStr);
                  const dd = Number(ddStr);
                  if (mm !== m0 + 1) continue; // only this month
                  const minutes = toWholeMinutes(s.value); // seconds → minutes (floor)
                  const idx = ranges.findIndex(r => inRange(dd, r.lo, r.hi));
                  if (idx >= 0) totals[idx] += minutes;
                }

                // Build chart data
                return ranges.map((r, i) => {
                  const monthISO = String(m0 + 1).padStart(2, '0');
                  const startISO = `${year}-${monthISO}-${String(r.lo).padStart(2, '0')}`;
                  const endISO   = `${year}-${monthISO}-${String(r.hi).padStart(2, '0')}`;
                  const label    = `${String(r.lo).padStart(2, '0')}–${String(r.hi).padStart(2, '0')}`;
                  return {
                    startISO,
                    endISO,
                    label,
                    focusMin: totals[i],
                  };
                });
              })()}
              todayISO={toISODate(new Date())}
              focusColor="#F46C6C"
            />
          )}
        </View>

        {/* Stats */}
        <StatsList
          sessionsCompleted={stats.sessionsCompleted ?? 0}
          avgSessionSec={(stats.sessionsCompleted ?? 0) > 0 ? (stats.avgSession ?? 0) : 0}
          longestSessionSec={stats.longestSession ?? 0}
        />

        {/* Debug reset (remove after testing) */}
        <Pressable
          onPress={async () => {
            try {
              await clearAllProgress();   // wipe daily focus/break seconds
              await clearAllSessions();   // wipe session list & stats
            } catch (e) {
              console.log('Reset error', e);
            }
          }}
          style={{
            alignSelf: 'center',
            marginTop: 12,
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: 10,
            backgroundColor: '#EEE',
          }}
        >
          <Text style={{ color: '#444', fontWeight: '600' }}>Debug: Reset data</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
