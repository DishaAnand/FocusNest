import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';

type Props = {
  sessionsCompleted: number;
  avgSessionSec: number;      // seconds
  longestSessionSec: number;  // seconds
};

function fmtHMsec(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (s >= 3600) {
    const h = Math.floor(s / 3600);
    const rem = Math.floor((s % 3600) / 60);
    return rem ? `${h}h ${rem}m` : `${h}h`;
  }
  return sec ? `${m}m ${sec}s` : `${m}m`;
}

export default function StatsList({ sessionsCompleted, avgSessionSec, longestSessionSec }: Props) {
  const { width } = useWindowDimensions();
  // responsive sizing
  const padH = Math.max(16, Math.min(24, Math.round(width * 0.05)));
  const titleSize = Math.max(12, Math.min(13, Math.round(width * 0.032)));
  const labelSize = Math.max(14, Math.min(16, Math.round(width * 0.038)));
  const valueSize = Math.max(20, Math.min(28, Math.round(width * 0.065)));

  return (
    <View style={[styles.card, { paddingHorizontal: padH }]}>
      <Row label="Sessions completed" labelSize={labelSize} value={`${sessionsCompleted}`} valueSize={valueSize} />
      <Divider />
      <Row label="Average session" labelSize={labelSize} value={fmtHMsec(avgSessionSec)} valueSize={valueSize} />
      <Divider />
      <Row label="Longest session" labelSize={labelSize} value={fmtHMsec(longestSessionSec)} valueSize={valueSize} />
    </View>
  );
}

function Row({ label, value, labelSize, valueSize }: { label: string; value: string; labelSize: number; valueSize: number }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { fontSize: labelSize }]}>{label}</Text>
      <Text style={[styles.value, { fontSize: valueSize }]}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 14,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    alignItems: 'center',
  },
  label: { color: '#2F5B57', fontWeight: '600' },
  value: { color: '#0D1F1E', fontWeight: '800' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.08)' },
});
