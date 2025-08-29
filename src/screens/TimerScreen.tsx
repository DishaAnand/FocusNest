import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, DeviceEventEmitter } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, { useSharedValue, withTiming, useAnimatedProps, Easing } from 'react-native-reanimated';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import Sound from 'react-native-sound';

import { addSessionSeconds, PROGRESS_UPDATED_EVENT } from '../storage/progressStore';
import { appendSession } from '../storage/sessionStore';

// ✅ settings (durations + auto-start)
import {
  getAutoStartBreak,
  getFocusMinutes,
  getBreakMinutes,
  SETTINGS_CHANGED_EVENT as SETTINGS_EVT,
} from '../storage/settings';

// ✅ tasks from store (so chips show even without params)
import { getTasks as loadTasks, TASKS_CHANGED_EVENT, Task } from '../storage/tasks';
import type { Task as TaskType } from '../storage/tasks'; // type alias if you want

type RootStackParamList = {
  Home: undefined;
  Timer: { task?: TaskType; tasks?: TaskType[]; autoStart?: boolean };
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
type Mode = 'focus' | 'break';

export default function TimerScreen() {
  const { params } = useRoute<TimerRoute>();

  /* ── tasks: load from store, merge with params (dedupe) ── */
  const [tasks, setTasks] = useState<Task[]>([]);
  const [task, setTask] = useState<Task | undefined>(undefined);

  function mergeTasks(a: Task[], b: Task[]): Task[] {
    const map = new Map<string, Task>();
    [...a, ...b].forEach(t => map.set(t.id, t));
    const arr = Array.from(map.values());
    return arr.length ? arr : [{ id: 'other', title: 'Other', icon: 'refresh-outline' }];
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      const stored = await loadTasks().catch(() => []);
      const incoming = params?.tasks ?? (params?.task ? [params.task] : []);
      const merged = mergeTasks(stored, incoming);
      if (!mounted) return;
      setTasks(merged);
      setTask(params?.task ?? merged[0]);
    })();

    const sub = DeviceEventEmitter.addListener(TASKS_CHANGED_EVENT, (updated: Task[]) => {
      const incoming = params?.tasks ?? (params?.task ? [params.task] : []);
      const merged = mergeTasks(updated || [], incoming);
      setTasks(merged);
      setTask(prev => (prev && merged.find(t => t.id === prev.id)) || merged[0]);
    });

    return () => { mounted = false; sub.remove(); };
  }, [params?.task, params?.tasks]);

  /* ── settings-driven durations ── */
  const [focusSecs, setFocusSecs] = useState(25 * 60);
  const [breakSecs, setBreakSecs] = useState(5 * 60);
  const [autoStartBreak, setAutoStartBreak] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [fm, bm, asb] = await Promise.all([
          getFocusMinutes().catch(() => 25),
          getBreakMinutes().catch(() => 5),
          getAutoStartBreak().catch(() => true),
        ]);
        if (!mounted) return;
        setFocusSecs(fm * 60);
        setBreakSecs(bm * 60);
        setAutoStartBreak(asb);
        setLeft(prev => {
          const target = mode === 'focus' ? fm * 60 : bm * 60;
          return (!run || prev === 0 || prev > target) ? target : prev;
        });
      } catch {}
    })();

    const sub = DeviceEventEmitter.addListener(SETTINGS_EVT, (p: any) => {
      if (p?.key === 'focusMin') {
        const secs = Number(p.value) * 60;
        setFocusSecs(secs);
        if (mode === 'focus' && (!run || left > secs)) setLeft(secs);
      } else if (p?.key === 'breakMin') {
        const secs = Number(p.value) * 60;
        setBreakSecs(secs);
        if (mode === 'break' && (!run || left > secs)) setLeft(secs);
      } else if (p?.key === 'autoStartBreak') {
        setAutoStartBreak(!!p.value);
      }
    });

    return () => { mounted = false; sub.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── timer state ── */
  const [mode, setMode] = useState<Mode>('focus');
  const DURATION = mode === 'focus' ? focusSecs : breakSecs;

  const [left, setLeft] = useState<number>(DURATION);
  const [run, setRun] = useState<boolean>(false);

  // when mode or durations change, keep left sensible
  useEffect(() => {
    setLeft(prev => {
      const target = DURATION;
      return (!run || prev > target) ? target : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, focusSecs, breakSecs]);

  /* ── sound ── */
  const soundRef = useRef<Sound | null>(null);
  const [hasBeeped, setHasBeeped] = useState(false);

  useEffect(() => {
    Sound.setCategory('Playback');
    const s = new Sound('beep-alarm-366507.mp3', Sound.MAIN_BUNDLE, (err) => {
      if (err) console.warn('Sound load error', err);
    });
    soundRef.current = s;
    return () => { s.release(); soundRef.current = null; };
  }, []);

  useEffect(() => {
    if (left === 0 && !hasBeeped) {
      try { soundRef.current?.stop(() => soundRef.current?.play()); } catch {}
      setHasBeeped(true);
    }
  }, [left, hasBeeped]);

  /* ── auto-start from Home (always starts Focus) ── */
  useEffect(() => {
    if (params?.autoStart) {
      setMode('focus');
      setLeft(focusSecs);
      setRun(true);
      setHasBeeped(false);
    }
  }, [params?.autoStart, focusSecs]);

  /* ── task selection resets the current phase only ── */
  useEffect(() => {
    if (!task) return;
    setRun(false);
    setLeft(mode === 'focus' ? focusSecs : breakSecs);
    setHasBeeped(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);

  /* ── animations & ticking ── */
  const progress = useSharedValue(0);
  const theta = useSharedValue(0);

  useEffect(() => {
    const frac = DURATION <= 0 ? 1 : 1 - left / DURATION;
    progress.value = withTiming(frac, { duration: 400, easing: Easing.linear });
    theta.value = withTiming(frac * 2 * Math.PI, { duration: 400, easing: Easing.linear });
  }, [left, DURATION, progress, theta]);

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | undefined;
    if (run) {
      id = setInterval(() => {
        setLeft(prev => {
          if (prev <= 1) { clearInterval(id!); setRun(false); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => id && clearInterval(id);
  }, [run]);

  /* ── phase transitions ── */
  useEffect(() => {
    if (left !== 0 || !hasBeeped) return;

    (async () => {
      const now = new Date();

      if (mode === 'focus') {
        try {
          await addSessionSeconds('focus', focusSecs, now);
          await appendSession('focus', focusSecs, now);
        } finally {
          DeviceEventEmitter.emit(PROGRESS_UPDATED_EVENT);
        }

        const shouldAuto = await getAutoStartBreak().catch(() => autoStartBreak);
        setMode('break');
        setLeft(breakSecs);
        setHasBeeped(false);
        setRun(!!shouldAuto);
      } else {
        try {
          await addSessionSeconds('break', breakSecs, now);
        } finally {
          DeviceEventEmitter.emit(PROGRESS_UPDATED_EVENT);
        }
        setRun(false);
      }
    })();
  }, [left, hasBeeped, mode, focusSecs, breakSecs, autoStartBreak]);

  /* ── helpers ── */
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
    return { cx: CENTER + RADIUS * Math.cos(a), cy: CENTER + RADIUS * Math.sin(a) };
  });

  const isFinished = left === 0;
  const isPaused = !run && left > 0 && left < DURATION;
  const primaryLabel = run ? 'Pause' : (isPaused ? 'Resume' : 'Start');

  const onPrimaryPress = () => {
    if (isFinished) {
      if (mode === 'break') {
        setMode('focus');
        setLeft(focusSecs);
        setRun(true);
        setHasBeeped(false);
      } else {
        setMode('break');
        setLeft(breakSecs);
        setRun(true);
        setHasBeeped(false);
      }
      return;
    }
    setRun(p => !p);
  };

  const onCancel = () => {
    if (mode === 'break') {
      setMode('focus');
      setRun(false);
      setLeft(focusSecs);
      setHasBeeped(false);
    } else {
      setRun(false);
      setLeft(focusSecs);
      setHasBeeped(false);
    }
  };

  // colors per mode
  const ACCENT = mode === 'focus' ? FOCUS_COLOR : BREAK_COLOR;
  const ACCENT_BG = mode === 'focus' ? FOCUS_BG : BREAK_BG;
  const CHIP_BG = mode === 'focus' ? FOCUS_CHIP_BG : BREAK_CHIP_BG;
  const CHIP_TEXT = mode === 'focus' ? FOCUS_CHIP_TEXT : BREAK_CHIP_TEXT;

  return (
    <View style={styles.container}>
      {/* chips */}
      {tasks.length > 0 ? (
        <FlatList
          style={styles.chipsList}
          data={tasks}
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
                  { backgroundColor: CHIP_BG },
                  active && { backgroundColor: ACCENT },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: CHIP_TEXT },
                    active && styles.chipTextActive,
                  ]}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      ) : null}

      <Text style={{ marginTop: 8, color: '#666', fontWeight: '600' }}>
        {mode === 'focus' ? 'Focus' : 'Break'}
      </Text>

      {/* circular timer */}
      <View style={[styles.svgWrapper, { width: SIZE, height: SIZE }]}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <G rotation="-90" origin={`${CENTER}, ${CENTER}`}>
            <Circle cx={CENTER} cy={CENTER} r={RADIUS} stroke={ACCENT} strokeWidth={RING_STROKE} fill="none" />
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
            <AnimatedCircle r={DOT_RADIUS} fill="#fff" stroke={ACCENT} strokeWidth={2} animatedProps={dotProps} />
          </G>
        </Svg>

        <Text style={styles.timerText}>{mmss()}</Text>
      </View>

      {/* controls */}
      <View style={styles.buttonRow}>
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
