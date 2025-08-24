// components/DailyBarChart.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';

type DayPoint = { label: string; value: number; date: string };
type Props = {
  data: DayPoint[];       // 7 items, value in MINUTES
  anchorISO?: string;
  focusColor?: string;
  todayISO?: string;
};

const PAD_L = 44;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 40;

const BAR_RADIUS = 6;
const BAR_MIN = 2;

const TICK_TEXT_SIZE = 10;

const roundUp = (n: number, step: number) => Math.ceil(n / step) * step;
const toH = (m: number) => Math.floor(m / 60);

function makeScale(minutes: number[], chartHeight: number) {
  const max = Math.max(0, ...minutes);
  const padded = max * 1.15;

  const valueToYBuilder = (top: number) =>
    (v: number) => PAD_T + (chartHeight - PAD_T - PAD_B) * (1 - v / top);

  if (padded < 90) {
    const top = Math.max(60, roundUp(padded, 10));
    const ticks: number[] = [];
    for (let v = 0; v <= top; v += 15) ticks.push(v);
    return {
      mode: 'min' as const,
      top,
      ticks,
      formatTick: (v: number) => `${v}m`,
      valueToY: valueToYBuilder(top),
    };
  }

  if (padded < 240) {
    const topMin = roundUp(padded, 30); // 120, 150, 180, 210, 240...
    const ticks: number[] = [];
    for (let v = 0; v <= topMin; v += 30) ticks.push(v);
    return {
      mode: 'hybrid' as const,
      top: topMin,
      ticks,
      formatTick: (v: number) => (v % 60 === 0 ? `${v / 60}h` : ''),
      valueToY: valueToYBuilder(topMin),
    };
  }

  const topHours = Math.max(4, Math.ceil(padded / 60));
  const stepH = topHours >= 10 ? 2 : 1;
  const top = topHours * 60;
  const ticks: number[] = [];
  for (let h = 0; h <= topHours; h += stepH) ticks.push(h * 60);
  return {
    mode: 'hour' as const,
    top,
    ticks,
    formatTick: (v: number) => `${v / 60}h`,
    valueToY: valueToYBuilder(top),
  };
}

export default function DailyBarChart({
  data,
  anchorISO,
  focusColor = '#F46C6C',
  todayISO,
}: Props) {
  const [chartW, setChartW] = useState<number>(0);
  const [chartH, setChartH] = useState<number>(260);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setChartW(w);
    // Taller, responsive height: ~0.75 aspect, clamped 220–340
    const h = Math.max(220, Math.min(340, Math.round(w * 0.75)));
    setChartH(h);
  };

  // Prepare data (minutes)
  const minutes = data.map(d => Math.max(0, Math.round(d.value)));
  const scale = useMemo(() => makeScale(minutes, chartH), [minutes, chartH]);

  // Compute dynamic bar width & gap from available inner width
  const innerW = Math.max(0, chartW - PAD_L - PAD_R);
  const targetBarW = Math.min(26, Math.max(18, Math.floor(innerW / 7 / 1.8)));
  const gap = Math.max(12, Math.floor((innerW - targetBarW * 7) / 6));
  const totalBarsW = 7 * targetBarW + 6 * gap;
  const startX = PAD_L + Math.max(0, (innerW - totalBarsW) / 2);

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      {chartW > 0 && (
        <Svg width={chartW} height={chartH}>
          {/* Y grid + labels */}
          <G>
            {scale.ticks.map((t, i) => {
              const y = scale.valueToY(t);
              const major = scale.mode === 'hybrid' ? t % 60 === 0 : true;
              return (
                <G key={`tick-${i}`}>
                  <Line
                    x1={PAD_L}
                    x2={chartW - PAD_R}
                    y1={y}
                    y2={y}
                    stroke="#0B0B0B"
                    opacity={major ? 0.08 : 0.05}
                    strokeWidth={1}
                  />
                  {!!scale.formatTick(t) && (
                    <SvgText
                      x={PAD_L - 6}
                      y={y + 3}
                      fontSize={TICK_TEXT_SIZE}
                      fill="#566"
                      textAnchor="end"
                    >
                      {scale.formatTick(t)}
                    </SvgText>
                  )}
                </G>
              );
            })}
          </G>

          {/* Bars */}
          <G>
            {data.map((d, idx) => {
              const x = startX + idx * (targetBarW + gap);
              const h = Math.max(
                BAR_MIN,
                (chartH - PAD_T - PAD_B) * (minutes[idx] / Math.max(1, scale.top))
              );
              const y = chartH - PAD_B - h;
              const isAnchor = anchorISO && d.date === anchorISO;
              const isToday = todayISO && d.date === todayISO;

              return (
                <G key={`bar-${idx}`}>
                  {isAnchor && (
                    <Rect
                      x={x - 3}
                      y={y - 3}
                      width={targetBarW + 6}
                      height={h + 6}
                      rx={BAR_RADIUS}
                      ry={BAR_RADIUS}
                      fill="none"
                      stroke={focusColor}
                      strokeOpacity={0.45}
                      strokeWidth={2}
                    />
                  )}
                  <Rect
                    x={x}
                    y={y}
                    width={targetBarW}
                    height={h}
                    rx={BAR_RADIUS}
                    ry={BAR_RADIUS}
                    fill={focusColor}
                    opacity={0.9}
                  />
                  <SvgText
                    x={x + targetBarW / 2}
                    y={chartH - 14}
                    fontSize={12}
                    fill="#1F2A2A"
                    textAnchor="middle"
                    fontWeight={isAnchor || isToday ? '700' : '500'}
                  >
                    {d.label}
                  </SvgText>
                </G>
              );
            })}
          </G>
        </Svg>
      )}

      {/* <Text style={styles.caption}>
        Bars show total minutes per day. Y-axis auto-switches to hours when needed.
      </Text> */}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', alignItems: 'center', paddingTop: 6 },
  caption: { marginTop: 6, color: '#6C7A7A', fontSize: 12 },
});
