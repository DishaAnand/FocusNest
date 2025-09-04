// components/SingleDayBarChart.tsx
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, {
  G,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
  Path,
  Rect,
} from 'react-native-svg';

type Props = {
  minutes: number;          // focus minutes for the selected day
  label: string;            // x-axis label (e.g., "Aug 24")
  color?: string;           // bar color
  isToday?: boolean;        // <-- NEW: show halo only when true
};

const PAD_L = 48, PAD_R = 14, PAD_T = 12, PAD_B = 44;
const TICK_TEXT_SIZE = 11;
const BAR_RADIUS = 10;      // matches WeeklyFocusChart vibe
const BAR_MIN = 2;

const roundUp = (n: number, step: number) => Math.ceil(n / step) * step;

function makeScale(mins: number, height: number) {
  const padded = mins * 1.15;
  const toY = (top: number) =>
    (v: number) => PAD_T + (height - PAD_T - PAD_B) * (1 - v / top);

  if (padded < 90) {
    const top = Math.max(60, roundUp(padded, 10));
    const ticks: number[] = [];
    for (let v = 0; v <= top; v += 15) ticks.push(v);
    return { top, ticks, format: (v: number) => `${v}m`, y: toY(top), hybrid: false };
  }
  if (padded < 240) {
    const top = roundUp(padded, 30);
    const ticks: number[] = [];
    for (let v = 0; v <= top; v += 30) ticks.push(v);
    return { top, ticks, format: (v: number) => (v % 60 === 0 ? `${v / 60}h` : ''), y: toY(top), hybrid: true };
  }
  const topH = Math.max(4, Math.ceil(padded / 60));
  const stepH = topH >= 10 ? 2 : 1;
  const top = topH * 60;
  const ticks: number[] = [];
  for (let h = 0; h <= topH; h += stepH) ticks.push(h * 60);
  return { top, ticks, format: (v: number) => `${v / 60}h`, y: toY(top), hybrid: false };
}

// same rounded-top shape you used in WeeklyFocusChart
function roundedTopPath(bx: number, topY: number, height: number, width: number) {
  const hh = Math.max(0, height);
  if (hh <= 0) return '';
  const radius = Math.min(BAR_RADIUS, width / 2, hh);
  return `
    M ${bx} ${topY + hh}
    L ${bx} ${topY + radius}
    Q ${bx} ${topY} ${bx + radius} ${topY}
    L ${bx + width - radius} ${topY}
    Q ${bx + width} ${topY} ${bx + width} ${topY + radius}
    L ${bx + width} ${topY + hh}
    Z
  `;
}

export default function SingleDayBarChart({
  minutes,
  label,
  color = '#F46C6C',
  isToday = false,
}: Props) {
  const [w, setW] = useState(0);
  const [h, setH] = useState(300);

  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setW(width);
    setH(Math.max(240, Math.min(360, Math.round(width * 0.75))));
  };

  const mins = Math.max(0, Math.floor(minutes));
  const scale = useMemo(() => makeScale(mins, h), [mins, h]);

  // geometry
  const innerW = Math.max(0, w - PAD_L - PAD_R);
  const barW = Math.min(90, Math.max(54, Math.round(innerW * 0.22)));
  const barX = PAD_L + Math.round((innerW - barW) / 2);

  // bar height & top
  const hasBar = mins > 0;
  const barH = hasBar ? Math.max(BAR_MIN, (h - PAD_T - PAD_B) * (mins / Math.max(1, scale.top))) : 0;
  const barTopY = h - PAD_B - barH;

  const barPathD = hasBar ? roundedTopPath(barX, barTopY, barH, barW) : '';

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      {w > 0 && (
        <Svg width={w} height={h}>
          <Defs>
            <LinearGradient id="sdb_grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={color} stopOpacity={1} />
              <Stop offset="100%" stopColor={color} stopOpacity={0.78} />
            </LinearGradient>
          </Defs>

          {/* grid + y-axis labels */}
          <G>
            {scale.ticks.map((t, i) => {
              const y = scale.y(t);
              const major = scale.hybrid ? t % 60 === 0 : true;
              return (
                <G key={`tick-${i}`}>
                  <Line x1={PAD_L} x2={w - PAD_R} y1={y} y2={y} stroke="#0B0B0B" opacity={major ? 0.08 : 0.04} />
                  {!!scale.format(t) && (
                    <SvgText x={PAD_L - 8} y={y + 4} fontSize={TICK_TEXT_SIZE} fill="#4A5A59" textAnchor="end">
                      {scale.format(t)}
                    </SvgText>
                  )}
                </G>
              );
            })}
          </G>

          {/* halo — ONLY for today, only if a bar exists */}
          {hasBar && isToday && (
            <Rect
              x={barX - 6}
              y={barTopY - 6}
              width={barW + 12}
              height={barH + 12}
              fill={color}
              opacity={0.08}
              rx={BAR_RADIUS + 4}
              ry={BAR_RADIUS + 4}
            />
          )}

          {/* main bar */}
          {hasBar && <Path d={barPathD} fill="url(#sdb_grad)" />}

          {/* x-axis label */}
          <SvgText
            x={barX + barW / 2}
            y={h - 16}
            fontSize={12}
            fill="#0E1A19"
            textAnchor="middle"
            fontWeight="700"
          >
            {label}
          </SvgText>
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', alignItems: 'center', paddingTop: 8 },
});
