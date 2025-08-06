import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { styles, CIRCLE_LENGTH, RADIUS } from './TimerScreen.styles';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const FOCUS_DURATION = 25 * 60; // 25 min

const TimerScreen = () => {
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_DURATION);
  const [isRunning, setIsRunning] = useState(false);

  const progress = useSharedValue(0); // 0 to 1
  const rotation = useSharedValue(0); // 0 to 2π

  // Animate progress change
  useEffect(() => {
    progress.value = withTiming(1 - secondsLeft / FOCUS_DURATION, { duration: 300 });
    rotation.value = withTiming((1 - secondsLeft / FOCUS_DURATION) * 2 * Math.PI, { duration: 300 });
  }, [secondsLeft]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval!);
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
  if (interval) clearInterval(interval);
};
  }, [isRunning]);

  const formatTime = () => {
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const startPause = () => setIsRunning(prev => !prev);
  const cancel = () => {
    setIsRunning(false);
    setSecondsLeft(FOCUS_DURATION);
  };

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCLE_LENGTH * (1 - progress.value),
  }));

  const animatedHandleStyle = useAnimatedProps(() => {
    const angle = rotation.value;
    const x = RADIUS + RADIUS * Math.sin(angle);
    const y = RADIUS - RADIUS * Math.cos(angle);
    return {
      cx: x,
      cy: y,
    };
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.taskTag}>
        <Text style={styles.taskTagText}>Do Gym</Text>
      </TouchableOpacity>

      <View style={styles.svgWrapper}>
        <Svg width={RADIUS * 2} height={RADIUS * 2}>
          <G rotation="-90" origin={`${RADIUS}, ${RADIUS}`}>
            {/* Base circle */}
            <Circle
              cx={RADIUS}
              cy={RADIUS}
              r={RADIUS}
              stroke="#23766D"
              strokeWidth={12}
              fill="none"
            />
            {/* Progress */}
            <AnimatedCircle
              cx={RADIUS}
              cy={RADIUS}
              r={RADIUS}
              stroke="#ccc"
              strokeWidth={12}
              fill="none"
              strokeDasharray={CIRCLE_LENGTH}
              animatedProps={animatedProps}
            />
            {/* Handle */}
            <AnimatedCircle
              r={8}
              fill="#23766D"
              animatedProps={animatedHandleStyle}
            />
          </G>
        </Svg>
        <Text style={styles.timerText}>{formatTime()}</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={cancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.startBtn} onPress={startPause}>
          <Text style={styles.startText}>{isRunning ? 'Pause' : 'Start'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TimerScreen;
