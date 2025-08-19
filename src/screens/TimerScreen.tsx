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
} from './TimerScreen.styles';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const FOCUS = 1 * 60; // seconds

export default function TimerScreen() {
  const { params } = useRoute<TimerRoute>();

  /* ───────────────────────────── tasks (chips) ─────────────────────────── */
  const allTasks: Task[] = useMemo(
    () => params?.tasks ?? (params?.task ? [params.task] : []),
    [params]
  );
  const initialTask = params?.task ?? allTasks[0];
  const [task, setTask] = useState<Task | undefined>(initialTask);

  /* ───────────────────────────── timer state ───────────────────────────── */
  const [left, setLeft] = useState(FOCUS);
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

  /* ───────────────────────── lifecycle & interactions ──────────────────── */
  // auto-start from Home
  useEffect(() => {
    if (params?.autoStart) {
      setLeft(FOCUS);
      setRun(true);
      setHasBeeped(false);
    }
  }, [params?.autoStart]);

  // if the selected task changes (chip tap), reset timer
  useEffect(() => {
    if (!task) return;
    setRun(false);
    setLeft(FOCUS);
    setHasBeeped(false);
  }, [task?.id]);

  // keep state in sync if parent passes a different single task
  useEffect(() => {
    if (!params?.task) return;
    setTask(params.task);
  }, [params?.task?.id]);

  /* ───────────────────────── animations & ticking ──────────────────────── */
  useEffect(() => {
    const frac = 1 - left / FOCUS;
    progress.value = withTiming(frac, { duration: 400, easing: Easing.linear });
    theta.value = withTiming(frac * 2 * Math.PI, { duration: 400, easing: Easing.linear });
  }, [left]);

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
  const isPaused = !run && left > 0 && left < FOCUS;
  const primaryLabel = run ? 'Pause' : (isPaused ? 'Resume' : 'Start');

  const onPrimaryPress = () => {
    if (isFinished) { setLeft(FOCUS); setRun(true); setHasBeeped(false); return; }
    setRun((p) => !p);
  };

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
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      ) : null}

      {/* circular timer (your original look) */}
      <View style={[styles.svgWrapper, { width: SIZE, height: SIZE }]}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <G rotation="-90" origin={`${CENTER}, ${CENTER}`}>
            {/* base ring (teal) */}
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              stroke="#23766D"
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
              stroke="#23766D"
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
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => { setRun(false); setLeft(FOCUS); setHasBeeped(false); }}
        >
          <Text style={styles.startText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.startBtn} onPress={onPrimaryPress}>
          <Text style={styles.startText}>{primaryLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
