// src/components/StatsList.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { AppColors } from '../theme/theme';

type Props = {
  colors: AppColors;                 // ← receive theme
  sessionsCompleted: number;
  avgSessionSec: number;
  longestSessionSec: number;
};

const toMin = (s: number) => Math.max(0, Math.floor(s / 60)) + 'm';

export default function StatsList({ colors, sessionsCompleted, avgSessionSec, longestSessionSec }: Props) {
  const styles = createStyles(colors);
  return (
    <View style={styles.card}>
      <Row colors={colors} label="Sessions completed" value={String(sessionsCompleted)} />
      <Divider colors={colors} />
      <Row colors={colors} label="Average session" value={toMin(avgSessionSec)} />
      <Divider colors={colors} />
      <Row colors={colors} label="Longest session" value={toMin(longestSessionSec)} />
    </View>
  );
}

function Row({ colors, label, value }: { colors: AppColors; label: string; value: string }) {
  const s = createStyles(colors);
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

function Divider({ colors }: { colors: AppColors }) {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />;
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    card: {
      marginTop: 18,
      backgroundColor: colors.card,            // ← themed card bg (dark = #1E1E1E)
      borderRadius: 18,
      paddingVertical: 8,
      paddingHorizontal: 16,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },
    row: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rowLabel: { color: colors.muted, fontWeight: '700', fontSize: 16 },
    rowValue: { color: colors.text, fontWeight: '800', fontSize: 18 },
  });
