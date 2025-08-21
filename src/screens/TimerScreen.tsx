import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedProps,
  Easing,
} from 'react-native-reanimated';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import Sound from 'react-native-sound';

type Task = { id: string; title: string; icon: string };
type RootStackParamList = {
  Home: undefined;
  Timer: { task?: Task; tasks?: Task[]; autoStart?: boolean };
};
type TimerRoute = RouteProp<RootStackParamList, 'Timer'>;

import {
  styles,
  RING_STROKE,
  DOT_RADIUS,
  RADIUS,
  CENTER,
  SIZE,
  CIRCLE_LEN,
  FOCUS_COLOR,
  FOCUS_BG,
  FOCUS_CHIP_BG,
  FOCUS_CHIP_TEXT,
  BREAK_COLOR,
  BREAK_BG,
  BREAK_CHIP_BG,
  BREAK_CHIP_TEXT,
} from './TimerScreen.styles';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ⏱ durations
const FOCUS_SECS = 1 * 60;      // keep your 1:00 focus for testing
const BREAK_SECS = 1 * 60;      // 5:00 break

type Mode = 'focus' | 'break';

export default function TimerScreen() {
  const { params } = useRoute<TimerRoute>();

  /* ───────────────────────────── tasks (chips) ─────────────────────────── */
  const allTasks: Task[] = useMemo(
    () => params?.tasks ?? (params?.task ? [params.task] : []),
    [params]
  );
  const initialTask = params?.task ?? allTasks[0];
  const [task, setTask] = useState<Task | undefined>(initialTask);

  /* ───────────────────────────── mode & timer state ────────────────────── */
  const [mode, setMode] = useState<Mode>('focus');
  const DURATION = mode === 'focus' ? FOCUS_SECS : BREAK_SECS;

  const [left, setLeft] = useState(DURATION);
  const [run, setRun] = useState(false);

  // rings
  const progress = useSharedValue(0); // 0 -> 1
  const theta = useSharedValue(0);    // 0 -> 2π

  /* ───────────────────────────── sound setup ───────────────────────────── */
  const soundRef = useRef<Sound | null>(null);
  const [hasBeeped, setHasBeeped] = useState(false);

  useEffect(() => {
    Sound.setCategory('Playback'); // iOS: play with silent switch
    const s = new Sound('beep-alarm-366507.mp3', Sound.MAIN_BUNDLE, (err) => {
      if (err) console.warn('Sound load error', err);
    });
    soundRef.current = s;
    return () => { s.release(); soundRef.current = null; };
  }, []);

  // play once when it hits 00:00
  useEffect(() => {
    if (left === 0 && !hasBeeped) {
      try { soundRef.current?.stop(() => soundRef.current?.play()); } catch {}
      setHasBeeped(true);
    }
  }, [left, hasBeeped]);

  /* ─────────────── auto-start from Home (always starts Focus) ──────────── */
  useEffect(() => {
    if (params?.autoStart) {
      setMode('focus');
      setLeft(FOCUS_SECS);
      setRun(true);
      setHasBeeped(false);
    }
  }, [params?.autoStart]);

  /* ───── if selected task changes (chip), reset the current phase only ─── */
  useEffect(() => {
    if (!task) return;
    setRun(false);
    setLeft(mode === 'focus' ? FOCUS_SECS : BREAK_SECS);
    setHasBeeped(false);
  }, [task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ───────── keep state in sync if parent passes a different single task ─ */
  useEffect(() => {
    if (!params?.task) return;
    setTask(params.task);
  }, [params?.task?.id]);

  /* ───────────────────────── animations & ticking ──────────────────────── */
  useEffect(() => {
    const frac = 1 - left / DURATION;
    progress.value = withTiming(frac, { duration: 400, easing: Easing.linear });
    theta.value = withTiming(frac * 2 * Math.PI, { duration: 400, easing: Easing.linear });
  }, [left, DURATION, progress, theta]);

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | undefined;
    if (run) {
      id = setInterval(() => {
        setLeft((prev) => {
          if (prev <= 1) { clearInterval(id!); setRun(false); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => id && clearInterval(id);
  }, [run]);

  // 🔁 Phase transitions:
  // Focus → Break: DO NOT autostart (your change #1)
  // Break → stop at 00:00; user decides next step
  useEffect(() => {
    if (left !== 0 || !hasBeeped) return;

    if (mode === 'focus') {
      // move to Break, but do NOT autostart
      setMode('break');
      setLeft(BREAK_SECS);
      setRun(false);
      setHasBeeped(false);
    } else {
      // finished Break: stop at 00:00 (user can Start to begin new Focus)
      setRun(false);
      // remain in break with left=0
    }
  }, [left, hasBeeped, mode]);

  /* ───────────────────────────── helpers ──────────────────────────────── */
  const mmss = () => {
    const m = Math.floor(left / 60).toString().padStart(2, '0');
    const s = (left % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCLE_LEN * (1 - progress.value),
  }));

  const dotProps = useAnimatedProps(() => {
    const a = theta.value;
    return {
      cx: CENTER + RADIUS * Math.cos(a),
      cy: CENTER + RADIUS * Math.sin(a),
    };
  });

  const isFinished = left === 0;
  const isPaused = !run && left > 0 && left < DURATION;
  const primaryLabel = run ? 'Pause' : (isPaused ? 'Resume' : 'Start');

  const onPrimaryPress = () => {
    // If finished:
    if (isFinished) {
      if (mode === 'break') {
        // start a brand-new Focus cycle
        setMode('focus');
        setLeft(FOCUS_SECS);
        setRun(true);
        setHasBeeped(false);
      } else {
        // finished Focus normally flips to Break (we already did it above and paused)
        // here, if user presses Start while at 00:00 in Focus (rare), begin Break
        setMode('break');
        setLeft(BREAK_SECS);
        setRun(true);
        setHasBeeped(false);
      }
      return;
    }
    // Toggle running
    setRun((p) => !p);
  };

  // Cancel:
  // - In Focus: reset Focus to full and pause (same as before)
  // - In Break: jump back to Focus full and pause (your change #4)
  const onCancel = () => {
    if (mode === 'break') {
      setMode('focus');
      setRun(false);
      setLeft(FOCUS_SECS);
      setHasBeeped(false);
    } else {
      setRun(false);
      setLeft(FOCUS_SECS);
      setHasBeeped(false);
    }
  };

  // 🎨 colors per mode (ring + dot stroke + primary/Cancel button, and chips)
  const ACCENT = mode === 'focus' ? FOCUS_COLOR : BREAK_COLOR;
  const ACCENT_BG = mode === 'focus' ? FOCUS_BG : BREAK_BG;
  const CHIP_BG = mode === 'focus' ? FOCUS_CHIP_BG : BREAK_CHIP_BG;
  const CHIP_TEXT = mode === 'focus' ? FOCUS_CHIP_TEXT : BREAK_CHIP_TEXT;

  /* ───────────────────────────── render ──────────────────────────────── */
  return (
    <View style={styles.container}>
      {/* tiny chips row */}
      {allTasks.length > 0 ? (
        <FlatList
          style={styles.chipsList}
          data={allTasks}
          keyExtractor={(t) => t.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}
          renderItem={({ item }) => {
            const active = task?.id === item.id;
            return (
              <TouchableOpacity
                onPress={() => setTask(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[
                  styles.chip,
                  { backgroundColor: CHIP_BG },           // base tint varies by mode (#2)
                  active && { backgroundColor: ACCENT },  // active chip matches ring color
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: CHIP_TEXT },                  // base text by mode
                    active && styles.chipTextActive,       // white when active
                  ]}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      ) : null}

      {/* small header for context (optional) */}
      <Text style={{ marginTop: 8, color: '#666', fontWeight: '600' }}>
        {mode === 'focus' ? 'Focus' : 'Break'}
      </Text>

      {/* circular timer */}
      <View style={[styles.svgWrapper, { width: SIZE, height: SIZE }]}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <G rotation="-90" origin={`${CENTER}, ${CENTER}`}>
            {/* base ring (accent) */}
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              stroke={ACCENT}
              strokeWidth={RING_STROKE}
              fill="none"
            />
            {/* progress ring (light) */}
            <AnimatedCircle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              stroke="#E6E6E6"
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={CIRCLE_LEN}
              animatedProps={ringProps}
            />
            {/* moving tip */}
            <AnimatedCircle
              r={DOT_RADIUS}
              fill="#fff"
              stroke={ACCENT}
              strokeWidth={2}
              animatedProps={dotProps}
            />
          </G>
        </Svg>

        {/* centered time label */}
        <Text style={styles.timerText}>{mmss()}</Text>
      </View>

      {/* controls */}
      <View style={styles.buttonRow}>
        {/* #3: Cancel uses the same color as Start */}
        <TouchableOpacity style={[styles.startBtn, { backgroundColor: ACCENT_BG }]} onPress={onCancel}>
          <Text style={styles.startText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.startBtn, { backgroundColor: ACCENT_BG }]} onPress={onPrimaryPress}>
          <Text style={styles.startText}>{primaryLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
