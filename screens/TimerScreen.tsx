import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedProps,
  Easing,
} from 'react-native-reanimated';

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
const FOCUS = 5 * 60;                               // 25-min timer

export default function TimerScreen() {
  /* state ----------------------------------------------------------------- */
  const [left, setLeft]   = useState(FOCUS);
  const [run,  setRun]    = useState(false);

  const progress = useSharedValue(0);                // 0->1
  const theta    = useSharedValue(0);                // 0->2π

  /* animate each second --------------------------------------------------- */
  useEffect(() => {
    const frac = 1 - left / FOCUS;

    progress.value = withTiming(frac, { duration: 400, easing: Easing.linear });
    theta.value    = withTiming(frac * 2 * Math.PI, { duration: 400, easing: Easing.linear });
  }, [left]);

  /* ticking loop ----------------------------------------------------------- */
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

  /* helpers ---------------------------------------------------------------- */
  const mmss = () => {
    const m = Math.floor(left / 60).toString().padStart(2, '0');
    const s = (left % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  /* animated props --------------------------------------------------------- */
  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCLE_LEN * (1 - progress.value),
  }));

  const dotProps = useAnimatedProps(() => {
  // shift by -90° so dot starts at 12-o’clock and stays glued to the ring’s tip
  const a = theta.value

  return {
    cx: CENTER + RADIUS * Math.cos(a),
    cy: CENTER + RADIUS * Math.sin(a),
  };
});

  /* render ----------------------------------------------------------------- */
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.taskTag}>
        <Text style={styles.taskTagText}>Do Gym</Text>
      </TouchableOpacity>

      <View style={[styles.svgWrapper, { width: SIZE, height: SIZE }]}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <G rotation="-90" origin={`${CENTER}, ${CENTER}`}>

            {/* 1 ▸ grey base ring */}
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              stroke="#23766D"
              strokeWidth={RING_STROKE}
              fill="none"
            />

            {/* 2 ▸ green progress ring */}
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

            {/* 3 ▸ white-centre dot */}
            <AnimatedCircle
              r={DOT_RADIUS}
              fill="#fff"
              stroke="#23766D"
              strokeWidth={2}
              animatedProps={dotProps}
            />
          </G>
        </Svg>

        <Text style={styles.timerText}>{mmss()}</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={() => { setRun(false); setLeft(FOCUS); }}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.startBtn} onPress={() => setRun(p => !p)}>
          <Text style={styles.startText}>{run ? 'Pause' : 'Start'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
