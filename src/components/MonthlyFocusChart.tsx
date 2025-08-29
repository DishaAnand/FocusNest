// components/MonthlyFocusChart.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
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
import { secsToWholeMinutes } from '../utils/time';


type MonthBucket = {
    startISO: string; // Monday ISO (YYYY-MM-DD)
    endISO: string;   // Sunday ISO (YYYY-MM-DD)
    label: string;    // e.g., "08-05 – 08-11" (short & clear)
    focusMin: number; // total focus minutes within that week bucket
};

type Props = {
    data: MonthBucket[];   // 4–6 bars typically
    focusColor?: string;
    todayISO?: string;     // highlight the bucket that contains "today"
};

const PAD_L = 48, PAD_R = 14, PAD_T = 12, PAD_B = 44;
const TICK_TEXT_SIZE = 11;
const BAR_RADIUS = 10;
const BAR_MIN = 2;

const roundUp = (n: number, step: number) => Math.ceil(n / step) * step;

function makeScale(values: number[], height: number) {
    const max = Math.max(0, ...values);
    const padded = max * 1.15;
    const toY = (top: number) => (v: number) =>
        PAD_T + (height - PAD_T - PAD_B) * (1 - v / top);

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

export default function MonthlyFocusChart({
    data,
    focusColor = '#F46C6C',
    todayISO,
}: Props) {
    const [w, setW] = useState(0);
    const [h, setH] = useState(300);

    const onLayout = (e: LayoutChangeEvent) => {
        const width = e.nativeEvent.layout.width;
        setW(width);
        // responsive height: ~0.72 aspect, clamp 240–360
        setH(Math.max(240, Math.min(360, Math.round(width * 0.72))));
    };

    const vals = data.map(d => Math.max(0, Math.floor(d.focusMin)));
    const scale = useMemo(() => makeScale(vals, h), [vals, h]);

    // geometry (N bars, N = data.length)
    const innerW = Math.max(0, w - PAD_L - PAD_R);
    const N = Math.max(1, data.length);
    const barW = Math.min(34, Math.max(20, Math.floor(innerW / N / 1.6)));
    const gap = Math.max(12, Math.floor((innerW - barW * N) / Math.max(1, N - 1)));
    const totalBarsW = N * barW + (N - 1) * gap;
    const startX = PAD_L + Math.max(0, (innerW - totalBarsW) / 2);

    const roundedTopPath = (bx: number, topY: number, height: number, width: number) => {
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
    };

    const within = (iso: string, start: string, end: string) =>
        iso >= start && iso <= end;

    return (
        <View style={styles.wrap} onLayout={onLayout}>
            {w > 0 && (
                <Svg width={w} height={h}>
                    <Defs>
                        <LinearGradient id="gradFocusM" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0%" stopColor={focusColor} stopOpacity={1} />
                            <Stop offset="100%" stopColor={focusColor} stopOpacity={0.78} />
                        </LinearGradient>
                    </Defs>

                    {/* grid + y labels */}
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

                    {/* bars */}
                    <G>
                        {data.map((d, idx) => {
                            const x = startX + idx * (barW + gap);
                            const value = Math.max(0, Math.floor(d.focusMin));
                            const focusH = value > 0 ? Math.max(BAR_MIN, (h - PAD_T - PAD_B) * (value / Math.max(1, scale.top))) : 0;

                            const topY = h - PAD_B - focusH;

                            const isCurrentWeek = !!todayISO && within(todayISO!, d.startISO, d.endISO);
                            const focusPathD = roundedTopPath(x, topY, focusH, barW);

                            return (
                                <G key={`bar-${idx}`}>
                                    {isCurrentWeek && (
                                        <Rect
                                            x={x - 6}
                                            y={topY - 6}
                                            width={barW + 12}
                                            height={focusH + 12}
                                            fill={focusColor}
                                            opacity={0.08}
                                            rx={BAR_RADIUS + 4}
                                            ry={BAR_RADIUS + 4}
                                        />
                                    )}
                                    <Path d={focusPathD} fill="url(#gradFocusM)" />
                                    <SvgText
                                        x={x + barW / 2}
                                        y={h - 16}
                                        fontSize={11}
                                        fill="#0E1A19"
                                        textAnchor="middle"
                                        fontWeight={isCurrentWeek ? '700' : '500'}
                                    >
                                        {d.label}
                                    </SvgText>
                                </G>
                            );
                        })}
                    </G>
                </Svg>
            )}

            <Text style={styles.caption}>Weekly buckets (Mon–Sun). Bars show total focus minutes per week.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { width: '100%', alignItems: 'center', paddingTop: 8 },
    caption: { marginTop: 8, color: '#6C7A7A', fontSize: 12, textAlign: 'center' },
});
