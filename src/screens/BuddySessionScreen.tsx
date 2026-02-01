import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Share,
  ActivityIndicator,
  Animated as RNAnimated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G } from 'react-native-svg';
import Reanimated, { useSharedValue, withTiming, useAnimatedProps, Easing } from 'react-native-reanimated';

interface Props {
  onBack: () => void;
}

// Reanimated circle for the timer ring/dot
const AnimatedCircle = Reanimated.createAnimatedComponent(Circle);

const BuddySessionScreen = ({ onBack }: Props) => {
  const insets = useSafeAreaInsets();
  const [task, setTask] = useState('');
  const [duration, setDuration] = useState(25);
  const [screen, setScreen] = useState<'create' | 'share' | 'active'>('create');
  const [sessionLink] = useState('https://focushaven.app/buddy/abc123 ');
  const [timeLeft, setTimeLeft] = useState(0);
  const [friendStatus, setFriendStatus] = useState<'focused' | 'away'>('focused');
  const [friendViolations, setFriendViolations] = useState(0);
  const pulseAnim = useRef(new RNAnimated.Value(0.5)).current;

  /* ─── Timer Geometry (moved to top so hooks can use them) ─── */
  const RING_STROKE = 8;
  const DOT_RADIUS = 14;
  const RADIUS = 120;
  const OUTER = RADIUS + RING_STROKE / 2 + DOT_RADIUS;
  const SIZE = OUTER * 2;
  const CENTER = OUTER;
  const CIRCLE_LEN = 2 * Math.PI * RADIUS;
  const totalSeconds = duration * 60;

  /* ─── Reanimated Shared Values ─── */
  const progress = useSharedValue(0);
  const theta = useSharedValue(0);

  /* ─── Animate ring/dot when timeLeft changes (only when active) ─── */
  useEffect(() => {
    if (screen !== 'active') return;
    // frac goes 0→1 as timer counts down (0 at start, 1 at end)
    const frac = totalSeconds <= 0 ? 1 : 1 - timeLeft / totalSeconds;
    progress.value = withTiming(frac, { duration: 400, easing: Easing.linear });
    theta.value = withTiming(frac * 2 * Math.PI, { duration: 400, easing: Easing.linear });
  }, [timeLeft, totalSeconds, screen, progress, theta]);

  /* ─── Animated Props ─── */
  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCLE_LEN * (1 - progress.value),
  }));

  const dotProps = useAnimatedProps(() => {
    const a = theta.value; // 0 at top (12 o'clock) because of G rotation="-90"
    return {
      cx: CENTER + RADIUS * Math.cos(a),
      cy: CENTER + RADIUS * Math.sin(a),
    };
  });

  // Pulse animation for share screen
  useEffect(() => {
    if (screen === 'share') {
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          RNAnimated.timing(pulseAnim, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    }
    return () => pulseAnim.stopAnimation();
  }, [screen, pulseAnim]);

  // Countdown timer
  useEffect(() => {
    if (screen !== 'active') return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          Alert.alert('🎉 Session Complete!', 'Great focus session!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [screen]);

  // Demo: simulate friend going away after 8 seconds
  useEffect(() => {
    if (screen !== 'active') return;

    const timeout = setTimeout(() => {
      setFriendStatus('away');
      setFriendViolations(1);
    }, 8000);

    return () => clearTimeout(timeout);
  }, [screen]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `Hey! Focus with me on FocusHaven 🔥 Join here: ${sessionLink}` });
    } catch {}
  };

  const handleCopy = () => {
    Alert.alert('Copied!', 'Link copied to clipboard');
  };

  const getStatusBadge = (status: string) => {
    if (status === 'focused') return { text: '✅ Focused', bg: '#E8F5E9', color: '#2e7d32' };
    if (status === 'away') return { text: '👀 Away', bg: '#FFF3E0', color: '#e65100' };
    return { text: '', bg: '#f0f0f0', color: '#666' };
  };

  // ─── SCREEN 4: ACTIVE SESSION ─────────────────────────────
  if (screen === 'active') {
    const myBadge = getStatusBadge('focused');
    const friendBadge = getStatusBadge(friendStatus);
    const bothFocused = friendStatus === 'focused';

    return (
      <View style={{ flex: 1, backgroundColor: '#f5f5f0', paddingTop: insets.top }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 }}>
          <TouchableOpacity onPress={() => setScreen('create')}>
            <Text style={{ fontSize: 24, color: '#1a1a1a' }}>✕</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a' }}>Focus Session</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Status Banner */}
        <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
          {bothFocused ? (
            <View style={{ backgroundColor: '#E8F5E9', borderRadius: 12, padding: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#2e7d32' }}>✨ Both focused!</Text>
            </View>
          ) : (
            <View style={{ backgroundColor: '#FFF3E0', borderRadius: 12, padding: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#e65100' }}>⚠️ Sarah left the app!</Text>
              <Text style={{ fontSize: 13, color: '#e65100', marginTop: 2 }}>Stay focused, you got this!</Text>
            </View>
          )}
        </View>

        {/* Circular Timer (Exact TimerScreen integration) */}
        <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
          <View style={{ justifyContent: 'center', alignItems: 'center', width: SIZE, height: SIZE }}>
            <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
              {/* rotation="-90" makes 0 radians start at 12 o'clock and move clockwise */}
              <G rotation="-90" origin={`${CENTER}, ${CENTER}`}>
                {/* Track (full ring color) */}
                <Circle
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  stroke="#2d7a6e"
                  strokeWidth={RING_STROKE}
                  fill="none"
                />
                {/* Animated progress mask (reveals track as it shrinks) */}
                <AnimatedCircle
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  stroke="#f5f5f0" // Background color acts as mask
                  strokeWidth={RING_STROKE}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={CIRCLE_LEN}
                  animatedProps={ringProps}
                />
                {/* Animated dot */}
                <AnimatedCircle
                  r={DOT_RADIUS}
                  fill="#fff"
                  stroke="#2d7a6e"
                  strokeWidth={2}
                  animatedProps={dotProps}
                />
              </G>
            </Svg>

            <Text style={{ position: 'absolute', fontSize: 56, fontWeight: '700', color: '#1a1a1a' }}>
              {formatTime(timeLeft)}
            </Text>
          </View>
        </View>

        {/* Buddy Cards */}
        <View style={{ paddingHorizontal: 20, flexDirection: 'row', gap: 12 }}>

          {/* My Card */}
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#2d7a6e', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>Y</Text>
            </View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1a1a1a' }}>You</Text>
            <Text style={{ fontSize: 12, color: '#666', marginTop: 2, marginBottom: 8 }} numberOfLines={1}>{task}</Text>
            <View style={{ backgroundColor: myBadge.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: myBadge.color }}>{myBadge.text}</Text>
            </View>
            <Text style={{ fontSize: 11, color: '#999', marginTop: 8 }}>Violations: 0</Text>
          </View>

          {/* Friend Card */}
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#e67e22', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>S</Text>
            </View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1a1a1a' }}>Sarah</Text>
            <Text style={{ fontSize: 12, color: '#666', marginTop: 2, marginBottom: 8 }} numberOfLines={1}>Study Math</Text>
            <View style={{ backgroundColor: friendBadge.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: friendBadge.color }}>{friendBadge.text}</Text>
            </View>
            <Text style={{ fontSize: 11, color: '#999', marginTop: 8 }}>Violations: {friendViolations}</Text>
          </View>

        </View>
      </View>
    );
  }

  // ─── SCREEN 3: SHARE LINK ─────────────────────────────────
  if (screen === 'share') {
    return (
      <View style={{ flex: 1, backgroundColor: '#f5f5f0', paddingTop: insets.top }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 }}>
          <TouchableOpacity onPress={() => setScreen('create')}>
            <Text style={{ fontSize: 28, color: '#1a1a1a' }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a' }}>Share & Wait</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={{ flex: 1, paddingHorizontal: 20, alignItems: 'center' }}>

          {/* Pulsing indicator */}
          <RNAnimated.View style={{ opacity: pulseAnim, marginTop: 32, marginBottom: 16 }}>
            <ActivityIndicator size="large" color="#2d7a6e" />
          </RNAnimated.View>

          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 }}>Waiting for your friend...</Text>
          <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 32 }}>Share the link below so they can join</Text>

          {/* Session summary */}
          <View style={{ width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#666', marginBottom: 6 }}>YOUR SESSION</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1a1a1a' }}>{task}</Text>
            <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>{duration} min · Starting now</Text>
          </View>

          {/* Link */}
          <View style={{ width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#666', marginBottom: 6 }}>SESSION LINK</Text>
            <Text style={{ fontSize: 14, color: '#2d7a6e' }} numberOfLines={1}>{sessionLink}</Text>
          </View>

          {/* Copy + Share buttons */}
          <View style={{ width: '100%', flexDirection: 'row', gap: 12, marginBottom: 40 }}>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
              onPress={handleCopy}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#2d7a6e' }}>📋 Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: '#2d7a6e', borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
              onPress={handleShare}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Goes to Screen 4 for demo */}
         {/* Demo button - remove when Firebase is live */}
          <TouchableOpacity
            style={{ backgroundColor: '#2d7a6e', borderRadius: 12, padding: 14, alignItems: 'center', width: '100%', marginBottom: 16 }}
            onPress={() => {
              setTimeLeft(duration * 60);
              setFriendStatus('focused');
              setFriendViolations(0);
              setScreen('active');
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>📲 Demo: Friend Joined!</Text>
          </TouchableOpacity>

          {/* Start Solo - goes back to main app */}
          <TouchableOpacity onPress={onBack}>
            <Text style={{ fontSize: 14, color: '#666', textDecorationLine: 'underline' }}>Start Solo Instead</Text>
          </TouchableOpacity>

        </View>
      </View>
    );
  }

  // ─── SCREEN 2: CREATE SESSION ─────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f0', paddingTop: insets.top }}>

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 }}>
        <TouchableOpacity onPress={onBack}>
          <Text style={{ fontSize: 28, color: '#1a1a1a' }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a' }}>Focus with Friend</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ paddingHorizontal: 20 }}>

        {/* Task Input */}
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 10 }}>YOUR TASK</Text>
        <TextInput
          style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 24 }}
          placeholder="What are you working on?"
          placeholderTextColor="#999"
          defaultValue={task}
          onChangeText={setTask}
        />

        {/* Duration */}
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 10 }}>DURATION</Text>
        <View style={{ flexDirection: 'row', backgroundColor: '#fff', padding: 4, borderRadius: 12, marginBottom: 24 }}>
          <TouchableOpacity
            style={{ flex: 1, padding: 14, borderRadius: 10, alignItems: 'center', backgroundColor: duration === 25 ? '#2d7a6e' : 'transparent' }}
            onPress={() => setDuration(25)}
          >
            <Text style={{ fontWeight: '600', color: duration === 25 ? '#fff' : '#1a1a1a' }}>25 min</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, padding: 14, borderRadius: 10, alignItems: 'center', backgroundColor: duration === 50 ? '#2d7a6e' : 'transparent' }}
            onPress={() => setDuration(50)}
          >
            <Text style={{ fontWeight: '600', color: duration === 50 ? '#fff' : '#1a1a1a' }}>50 min</Text>
          </TouchableOpacity>
        </View>

        {/* Start Time */}
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 10 }}>START TIME</Text>
        <View style={{ flexDirection: 'row', backgroundColor: '#fff', padding: 4, borderRadius: 12, marginBottom: 24 }}>
          <TouchableOpacity style={{ flex: 1, padding: 14, borderRadius: 10, alignItems: 'center', backgroundColor: '#2d7a6e' }}>
            <Text style={{ fontWeight: '600', color: '#fff' }}>Now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, padding: 14, borderRadius: 10, alignItems: 'center', opacity: 0.5 }}
            onPress={() => Alert.alert('Premium', 'Coming soon!')}
          >
            <Text style={{ fontWeight: '600', color: '#1a1a1a' }}>Schedule 🔒</Text>
          </TouchableOpacity>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={{ backgroundColor: '#2d7a6e', borderRadius: 12, padding: 18, alignItems: 'center', opacity: task.trim() ? 1 : 0.5 }}
          onPress={() => {
            if (!task.trim()) {
              Alert.alert('Enter a task', 'What are you working on?');
              return;
            }
            setScreen('share');
          }}
          disabled={!task.trim()}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>Create & Share Link</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
};

export default BuddySessionScreen;