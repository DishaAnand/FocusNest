// screens/ProgressScreen.tsx
import React from 'react';
import { View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './ProgressScreen.styles';
import SegmentedTabs from '../components/SegmentedTabs';
import BarChart from '../components/BarChart';
import SingleDayBarChart from '../components/SingleDayBarChart';
import WeeklyFocusChart from '../components/WeeklyStackedChart';      // ⬅️ focus-only weekly
import MonthlyFocusChart from '../components/MonthlyFocusChart';
import StatsList from '../components/StatsList';
import { useProgress } from '../hooks/useProgress';
import { toISODate } from '../utils/date';

const fmtHM = (s: number) => `${Math.floor(s / 60)} min`;

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
              backgroundColor: '#FFFFFF',
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
            <Text style={styles.big}>{fmtHM(summary.focus)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.cardCol}>
            <Text style={styles.cardLabelHidden}>.</Text>
            <Text style={styles.subTitle}>Break</Text>
            <Text style={styles.big}>
              {summary.break < 60 ? `${Math.max(0, Math.round(summary.break / 60))}m` : fmtHM(summary.break)}
            </Text>
          </View>
        </View>

        {/* Chart */}
        <View style={{ alignSelf: 'center', width: chartWidth, marginTop: 16 }}>
          {mode === 'Daily' ? (
            <SingleDayBarChart
              minutes={Math.round(summary.focus / 60)} // seconds → minutes
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
                  focusMin: Math.max(0, Math.round(s.value / 60)), // seconds → minutes
                };
              })}
              todayISO={toISODate(new Date())}
              focusColor="#F46C6C"
            />
          ) : (
            // MONTHLY → fixed day buckets (01–07, 08–14, 15–21, 22–28, 29–end), focus-only
            // MONTHLY → fixed month-day buckets starting at 01
            <MonthlyFocusChart
              data={(() => {
                const year = anchor.getFullYear();
                const m0 = anchor.getMonth();                       // 0-based month
                const endDay = daysInMonth(year, m0);

                // Define the 5 possible month buckets
                const ranges: Array<{ lo: number; hi: number }> = [
                  { lo: 1, hi: Math.min(7, endDay) },
                  { lo: 8, hi: Math.min(14, endDay) },
                  { lo: 15, hi: Math.min(21, endDay) },
                  { lo: 22, hi: Math.min(28, endDay) },
                  { lo: 29, hi: endDay },
                ].filter(r => r.lo <= r.hi); // drop last if month ends before 29

                // Initialize totals
                const totals = ranges.map(() => 0);

                // Accumulate focus MINUTES for each day into its range
                for (const s of series) {
                  const [, mm, dd] = s.date.split('-').map(Number); // tz-safe
                  if (mm !== m0 + 1) continue;                      // keep only current month
                  const day = dd;
                  const minutes = Math.max(0, Math.round(s.value / 60)); // seconds → minutes
                  const idx = ranges.findIndex(r => inRange(day, r.lo, r.hi));
                  if (idx >= 0) totals[idx] += minutes;
                }

                // Build chart buckets
                return ranges.map((r, i) => {
                  const startISO = `${year}-${String(m0 + 1).padStart(2, '0')}-${String(r.lo).padStart(2, '0')}`;
                  const endISO = `${year}-${String(m0 + 1).padStart(2, '0')}-${String(r.hi).padStart(2, '0')}`;
                  const label = `${String(r.lo).padStart(2, '0')}–${String(r.hi).padStart(2, '0')}`;
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
          sessionsCompleted={stats.sessionsCompleted}
          avgSessionSec={stats.avgSession}
          longestSessionSec={stats.longestSession}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
