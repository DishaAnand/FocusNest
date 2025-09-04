import React from 'react';
import { View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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

import { useAppTheme } from '../theme/ThemeProvider';
import { createProgressStyles } from './ProgressScreen.styles';

const toWholeMinutes = (sec: number) => Math.max(0, Math.floor(sec / 60));

export default function ProgressScreen() {
  const {
    mode, setMode, anchor, title, summary, series, stats, goPrev, goNext, canGoNext,
  } = useProgress();

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const styles = createProgressStyles(colors);   // ← use the factory

  const pagePadH = Math.max(16, Math.min(24, Math.round(width * 0.05)));
  const topGap = Math.max(16, insets.top + 12);
  const chartWidth = Math.max(300, Math.min(520, width - pagePadH * 2));

  const overviewHeading =
    mode === 'Daily' ? 'TODAY OVERVIEW' : mode === 'Weekly' ? 'THIS WEEK OVERVIEW' : 'THIS MONTH OVERVIEW';

  const daysInMonth = (y: number, mZero: number) => new Date(y, mZero + 1, 0).getDate();
  const inRange = (d: number, lo: number, hi: number) => d >= lo && d <= hi;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
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
              backgroundColor: colors.primaryBg,
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
              minutes={secsToWholeMinutes(summary.focus)}
              label={anchor.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              color={colors.primary}
              isToday={toISODate(anchor) === toISODate(new Date())}  // <-- add this line
            />

          ) : mode === 'Weekly' ? (
            <WeeklyFocusChart
              data={series.map((s) => {
                const [, mm, dd] = s.date.split('-');
                return { date: s.date, label: `${mm}-${dd}`, focusMin: secsToWholeMinutes(s.value) };
              })}
              todayISO={toISODate(new Date())}
              focusColor={colors.primary}
            />
          ) : (
            <MonthlyFocusChart
              data={(() => {
                const year = anchor.getFullYear();
                const m0 = anchor.getMonth();
                const endDay = daysInMonth(year, m0);
                const ranges = [
                  { lo: 1, hi: Math.min(7, endDay) },
                  { lo: 8, hi: Math.min(14, endDay) },
                  { lo: 15, hi: Math.min(21, endDay) },
                  { lo: 22, hi: Math.min(28, endDay) },
                  { lo: 29, hi: endDay },
                ].filter(r => r.lo <= r.hi);
                const totals = ranges.map(() => 0);
                for (const s of series) {
                  const [, mmStr, ddStr] = s.date.split('-');
                  const mm = Number(mmStr); const dd = Number(ddStr);
                  if (mm !== m0 + 1) continue;
                  const minutes = toWholeMinutes(s.value);
                  const idx = ranges.findIndex(r => dd >= r.lo && dd <= r.hi);
                  if (idx >= 0) totals[idx] += minutes;
                }
                return ranges.map((r, i) => {
                  const monthISO = String(m0 + 1).padStart(2, '0');
                  const label = `${String(r.lo).padStart(2, '0')}–${String(r.hi).padStart(2, '0')}`;
                  return {
                    startISO: `${year}-${monthISO}-${String(r.lo).padStart(2, '0')}`,
                    endISO: `${year}-${monthISO}-${String(r.hi).padStart(2, '0')}`,
                    label,
                    focusMin: totals[i],
                  };
                });
              })()}
              todayISO={toISODate(new Date())}
              focusColor={colors.primary}
            />
          )}
        </View>

        {/* Stats (themed) */}
        <StatsList
          colors={colors}   // ← pass theme down
          sessionsCompleted={stats.sessionsCompleted ?? 0}
          avgSessionSec={(stats.sessionsCompleted ?? 0) > 0 ? (stats.avgSession ?? 0) : 0}
          longestSessionSec={stats.longestSession ?? 0}
        />

        {/* Debug reset */}
        <Pressable
          onPress={async () => {
            try { await clearAllProgress(); await clearAllSessions(); } catch (e) { console.log('Reset error', e); }
          }}
          style={styles.resetBtn}
        >
          <Text style={styles.resetText}>Debug: Reset data</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
