// screens/ProgressScreen.tsx
import React from 'react';
import { View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './ProgressScreen.styles';
import SegmentedTabs from '../components/SegmentedTabs';
import BarChart from '../components/BarChart';
import SingleDayBarChart from '../components/SingleDayBarChart';
import StatsList from '../components/StatsList';
import { useProgress } from '../hooks/useProgress';
import { toISODate } from '../utils/date';

const fmtHM = (s: number) => `${Math.floor(s / 60)} min`;

export default function ProgressScreen() {
  const { mode, setMode, title, summary, series, stats, goPrev, goNext, canGoNext } = useProgress();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const pagePadH = Math.max(16, Math.min(24, Math.round(width * 0.05)));
  const topGap = Math.max(16, insets.top + 12);

  // compute a nice chart width; DailyBarChart measures this container
  const chartWidth = Math.max(280, Math.min(480, width - pagePadH * 2));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F7F3' }}>
      <ScrollView
        style={[styles.container, { paddingHorizontal: pagePadH }]}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
      >
        {/* Tabs */}
        <View style={{ paddingTop: topGap, paddingBottom: 14, alignItems: 'center' }}>
          <View
            style={{
              borderRadius: 16,
              padding: 4,
              backgroundColor: 'rgba(0,0,0,0.04)',
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
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
        <View style={[styles.card, { marginTop: 8 }]}>
          <View style={styles.cardCol}>
            <Text style={styles.cardLabel}>DAILY OVERVIEW</Text>
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

        {/* NEW: Session stats */}


        {/* Chart */}
        <View style={{ alignSelf: 'center', width: chartWidth, marginTop: 12 }}>
          {mode === 'Daily' ? (
            <SingleDayBarChart
              minutes={Math.round(summary.focus / 60)}          // summary.focus is seconds → minutes
              label={new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} // e.g., "Aug 24"
              color="#F46C6C"
            />
          ) : (
            <BarChart data={series.map((s) => ({ label: s.label, value: s.value }))} />
          )}
        </View>
        <StatsList
          sessionsCompleted={stats.sessionsCompleted}
          avgSessionSec={stats.avgSession}
          longestSessionSec={stats.longestSession}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
