import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { COLORS } from '../constants/colors';

type Item = { label: string; value: number };
type Props = {
  data: Item[];               // values are seconds
  height?: number;
  barRadius?: number;
  showXAxis?: boolean;
};

const secondsToMinutes = (s: number) => Math.round(s / 60);

export default function BarChart({ data, height = 180, barRadius = 8, showXAxis = true }: Props) {
  const values = data.map(d => d.value);
  const max = Math.max(...values, 1);
  const width = Math.max(data.length * 38, 260);
  const padding = 16;
  const innerW = width - padding * 2;
  const barW = innerW / data.length * 0.6;
  const gap = innerW / data.length * 0.4;

  return (
    <View>
      <View style={{ height, width }}>
        <Svg width={width} height={height}>
          {data.map((d, i) => {
            const h = (d.value / max) * (height - 12);
            const x = padding + i * (barW + gap) + gap * 0.5;
            const y = height - h;
            return <Rect key={i} x={x} y={y} rx={barRadius} ry={barRadius} width={barW} height={h} fill={COLORS.primary2} />;
          })}
        </Svg>
      </View>
      {showXAxis && (
        <View style={[styles.row, { width }]}>
          {data.map((d, i) => (
            <Text key={i} style={styles.xLabel} numberOfLines={1}>{d.label}</Text>
          ))}
        </View>
      )}
      {/* Simple y caption to hint units */}
      <Text style={styles.caption}>Bars show focus minutes/day</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
  },
  xLabel: { color: '#374151', width: 32, textAlign: 'center' },
  caption: { color: '#6B7280', fontSize: 12, marginTop: 6 },
});
