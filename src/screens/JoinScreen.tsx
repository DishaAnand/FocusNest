import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated as RNAnimated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G } from 'react-native-svg';
import Reanimated, { useSharedValue, withTiming, useAnimatedProps, Easing } from 'react-native-reanimated';
import {
  joinSession,
  listenToSession,
  listenToServerTimeOffset,
  getSession,
  SessionData,
} from '../services/sessionService';

interface Props {
  sessionId: string;
  onBack: () => void;
  onJoined: () => void;
}

const AnimatedCircle = Reanimated.createAnimatedComponent(Circle);

const JoinScreen = ({ sessionId, onBack, onJoined }: Props) => {
  const insets = useSafeAreaInsets();
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [screen, setScreen] = useState<'join' | 'waiting' | 'active' | 'complete'>('join');
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new RNAnimated.Value(0.5)).current;
  const celebrateAnim = useRef(new RNAnimated.Value(0)).current;

  /* ─── Timer Geometry ─── */
  const RING_STROKE = 8;
  const DOT_RADIUS = 14;
  const RADIUS = 120;
  const OUTER = RADIUS + RING_STROKE / 2 + DOT_RADIUS;
  const SIZE = OUTER * 2;
  const CENTER = OUTER;
  const totalSeconds = (sessionData?.duration || 25) * 60;
  const CIRCLE_LEN = 2 * Math.PI * RADIUS;

  /* ─── Reanimated Shared Values ─── */
  const progress = useSharedValue(0);
  const theta = useSharedValue(0);

  /* ─── Get Server Time Offset ─── */
  useEffect(() => {
    const unsubscribe = listenToServerTimeOffset((offset) => {
      setServerTimeOffset(offset);
    });
    return () => unsubscribe();
  }, []);

  /* ─── Listen to Session Data ─── */
  useEffect(() => {
    if (!joined) return;

    const unsubscribe = listenToSession(sessionId, (data) => {
      if (data) {
        setSessionData(data);

        // When creator starts the session, move to active screen
        if (data.status === 'active' && screen === 'waiting') {
          setScreen('active');
        }

        // When session completes
        if (data.status === 'complete' && screen === 'active') {
          setScreen('complete');
        }
      }
    });

    return () => unsubscribe();
  }, [joined, sessionId, screen]);

  /* ─── SYNCED TIMER CALCULATION ─── */
  useEffect(() => {
    if (screen !== 'active' || !sessionData?.startTime) return;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    const calculateTimeLeft = () => {
      const serverNow = Date.now() + serverTimeOffset;
      const endTime = sessionData.startTime! + (sessionData.duration * 60 * 1000);
      const remaining = Math.max(0, Math.floor((endTime - serverNow) / 1000));
      return remaining;
    };

    setTimeLeft(calculateTimeLeft());

    timerIntervalRef.current = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timerIntervalRef.current!);
        setScreen('complete');
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [screen, sessionData?.startTime, sessionData?.duration, serverTimeOffset]);

  /* ─── Animate ring/dot ─── */
  useEffect(() => {
    if (screen !== 'active') return;
    const frac = totalSeconds <= 0 ? 1 : 1 - timeLeft / totalSeconds;
    progress.value = withTiming(frac, { duration: 400, easing: Easing.linear });
    theta.value = withTiming(frac * 2 * Math.PI, { duration: 400, easing: Easing.linear });
  }, [timeLeft, totalSeconds, screen, progress, theta]);

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

  /* ─── Pulse animation for waiting screen ─── */
  useEffect(() => {
    if (screen === 'waiting') {
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          RNAnimated.timing(pulseAnim, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    }
    return () => pulseAnim.stopAnimation();
  }, [screen, pulseAnim]);

  /* ─── Celebration animation ─── */
  useEffect(() => {
    if (screen === 'complete') {
      celebrateAnim.setValue(0);
      RNAnimated.spring(celebrateAnim, {
        toValue: 1,
        tension: 40,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }
  }, [screen, celebrateAnim]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      // First check if session exists
      const session = await getSession(sessionId);
      if (!session) {
        Alert.alert('Session Not Found', 'This session link is invalid or has expired.');
        setJoining(false);
        return;
      }

      await joinSession(sessionId);
      setJoined(true);
      setSessionData(session);
      setScreen('waiting');
    } catch (e) {
      Alert.alert('Error', 'Could not join session. Try again.');
      setJoining(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'focused') return { text: '✅ Focused', bg: '#E8F5E9', color: '#2e7d32' };
    if (status === 'away') return { text: '👀 Away', bg: '#FFF3E0', color: '#e65100' };
    return { text: '', bg: '#f0f0f0', color: '#666' };
  };

  // ─── COMPLETE SCREEN ──────────────────────────────────────
  if (screen === 'complete') {
    const scaleInterp = celebrateAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1.2, 1] });

    return (
      <View style={{ flex: 1, backgroundColor: '#f5f5f0', paddingTop: insets.top }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 }}>
          <TouchableOpacity onPress={onBack}>
            <Text style={{ fontSize: 24, color: '#1a1a1a' }}>✕</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a' }}>Session Complete</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={{ flex: 1, paddingHorizontal: 20, alignItems: 'center' }}>
          <RNAnimated.Text style={{ fontSize: 72, marginTop: 24, marginBottom: 8, transform: [{ scale: scaleInterp }] }}>
            🎉
          </RNAnimated.Text>

          <Text style={{ fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 }}>Great session!</Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 28 }}>You both stayed focused</Text>

          <View style={{ width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1a1a1a' }}>{sessionData?.task || 'Focus Session'}</Text>
              <Text style={{ fontSize: 14, color: '#666' }}>{sessionData?.duration || 25} min</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#2d7a6e' }} />
                <Text style={{ fontSize: 13, color: '#666' }}>Creator: {sessionData?.creatorViolations || 0} violations</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#e67e22' }} />
                <Text style={{ fontSize: 13, color: '#666' }}>You: {sessionData?.friendViolations || 0}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={{ width: '100%', backgroundColor: '#2d7a6e', borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
            onPress={onBack}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>Back Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── ACTIVE SESSION SCREEN (Friend's view) ────────────────
  if (screen === 'active') {
    const myBadge = getStatusBadge(sessionData?.friendStatus === 'away' ? 'away' : 'focused');
    const creatorBadge = getStatusBadge(sessionData?.creatorStatus || 'focused');
    const bothFocused = sessionData?.creatorStatus === 'focused' && sessionData?.friendStatus !== 'away';

    return (
      <View style={{ flex: 1, backgroundColor: '#f5f5f0', paddingTop: insets.top }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 }}>
          <TouchableOpacity onPress={onBack}>
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
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#e65100' }}>⚠️ Someone left the app!</Text>
              <Text style={{ fontSize: 13, color: '#e65100', marginTop: 2 }}>Stay focused, you got this!</Text>
            </View>
          )}
        </View>

        {/* Circular Timer */}
        <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
          <View style={{ justifyContent: 'center', alignItems: 'center', width: SIZE, height: SIZE }}>
            <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
              <G rotation="-90" origin={`${CENTER}, ${CENTER}`}>
                <Circle cx={CENTER} cy={CENTER} r={RADIUS} stroke="#2d7a6e" strokeWidth={RING_STROKE} fill="none" />
                <AnimatedCircle
                  cx={CENTER} cy={CENTER} r={RADIUS}
                  stroke="#f5f5f0" strokeWidth={RING_STROKE} strokeLinecap="round"
                  fill="none" strokeDasharray={CIRCLE_LEN}
                  animatedProps={ringProps}
                />
                <AnimatedCircle r={DOT_RADIUS} fill="#fff" stroke="#2d7a6e" strokeWidth={2} animatedProps={dotProps} />
              </G>
            </Svg>
            <Text style={{ position: 'absolute', fontSize: 56, fontWeight: '700', color: '#1a1a1a' }}>
              {formatTime(timeLeft)}
            </Text>
          </View>
        </View>

        {/* Buddy Cards */}
        <View style={{ paddingHorizontal: 20, flexDirection: 'row', gap: 12 }}>
          {/* Creator card */}
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#2d7a6e', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>
                {sessionData?.creator?.charAt(0).toUpperCase() || 'C'}
              </Text>
            </View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1a1a1a' }}>Host</Text>
            <Text style={{ fontSize: 12, color: '#666', marginTop: 2, marginBottom: 8 }} numberOfLines={1}>
              {sessionData?.task || 'Focus'}
            </Text>
            <View style={{ backgroundColor: creatorBadge.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: creatorBadge.color }}>{creatorBadge.text}</Text>
            </View>
            <Text style={{ fontSize: 11, color: '#999', marginTop: 8 }}>Violations: {sessionData?.creatorViolations || 0}</Text>
          </View>

          {/* You (friend) card */}
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#e67e22', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>Y</Text>
            </View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1a1a1a' }}>You</Text>
            <Text style={{ fontSize: 12, color: '#666', marginTop: 2, marginBottom: 8 }} numberOfLines={1}>
              {sessionData?.friendTask || 'Focus'}
            </Text>
            <View style={{ backgroundColor: myBadge.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: myBadge.color }}>{myBadge.text}</Text>
            </View>
            <Text style={{ fontSize: 11, color: '#999', marginTop: 8 }}>Violations: {sessionData?.friendViolations || 0}</Text>
          </View>
        </View>
      </View>
    );
  }

  // ─── WAITING FOR HOST TO START ────────────────────────────
  if (screen === 'waiting') {
    return (
      <View style={{ flex: 1, backgroundColor: '#f5f5f0', paddingTop: insets.top }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 }}>
          <TouchableOpacity onPress={onBack}>
            <Text style={{ fontSize: 28, color: '#1a1a1a' }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a' }}>Joined!</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={{ flex: 1, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <Text style={{ fontSize: 40 }}>✅</Text>
          </View>

          <Text style={{ fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 }}>You're in!</Text>
          <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 32 }}>
            Waiting for your friend to start the session...
          </Text>

          <RNAnimated.View style={{ opacity: pulseAnim }}>
            <ActivityIndicator size="large" color="#2d7a6e" />
          </RNAnimated.View>

          {/* Session info */}
          <View style={{ width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 40 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#666', marginBottom: 6 }}>SESSION DETAILS</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1a1a1a' }}>{sessionData?.task || 'Focus Session'}</Text>
            <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>{sessionData?.duration || 25} min</Text>
          </View>
        </View>
      </View>
    );
  }

  // ─── JOIN SCREEN (initial) ────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f0', paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 }}>
        <TouchableOpacity onPress={onBack}>
          <Text style={{ fontSize: 28, color: '#1a1a1a' }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a' }}>Join Session</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#2d7a6e', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 40 }}>👥</Text>
        </View>

        <Text style={{ fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 }}>Join Focus Session</Text>
        <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 8 }}>
          Your friend invited you to focus together
        </Text>

        <View style={{ width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 40, alignItems: 'center' }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#666', marginBottom: 6 }}>SESSION ID</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#2d7a6e' }}>{sessionId}</Text>
        </View>

        <TouchableOpacity
          style={{ width: '100%', backgroundColor: '#2d7a6e', borderRadius: 12, paddingVertical: 18, alignItems: 'center', opacity: joining ? 0.6 : 1 }}
          onPress={handleJoin}
          disabled={joining}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
            {joining ? 'Joining...' : 'Join Session 🔥'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default JoinScreen;
