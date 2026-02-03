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
import {
  createSession,
  generateSessionId,
  listenForFriendJoin,
  startSession,
  listenToSession,
  listenToServerTimeOffset,
  SessionData,
} from '../services/sessionService';

interface Props {
  onBack: () => void;
}

const AnimatedCircle = Reanimated.createAnimatedComponent(Circle);

const BuddySessionScreen = ({ onBack }: Props) => {
  const insets = useSafeAreaInsets();
  const [task, setTask] = useState('');
  const [duration, setDuration] = useState(25);
  const [screen, setScreen] = useState<'create' | 'share' | 'active' | 'complete'>('create');
  const [sessionId, setSessionId] = useState('');
  const [sessionLink, setSessionLink] = useState('');
  const [friendJoined, setFriendJoined] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [friendStatus, setFriendStatus] = useState<'focused' | 'away'>('focused');
  const [friendViolations, setFriendViolations] = useState(0);
  const [myViolations, setMyViolations] = useState(0);
  const [rating, setRating] = useState(0);
  const pulseAnim = useRef(new RNAnimated.Value(0.5)).current;
  const celebrateAnim = useRef(new RNAnimated.Value(0)).current;

  // ─── SYNCED TIMER STATE ───────────────────────────────────
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /* ─── Timer Geometry ─── */
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

  /* ─── Get Server Time Offset on Mount ─── */
  useEffect(() => {
    const unsubscribe = listenToServerTimeOffset((offset) => {
      setServerTimeOffset(offset);
    });
    return () => unsubscribe();
  }, []);

  /* ─── Listen to Session Data (for synced timer) ─── */
  useEffect(() => {
    if (!sessionId || screen === 'create') return;

    const unsubscribe = listenToSession(sessionId, (data) => {
      if (data) {
        setSessionData(data);
        setFriendStatus(data.friendStatus === 'away' ? 'away' : 'focused');
        setFriendViolations(data.friendViolations);
        setMyViolations(data.creatorViolations);

        // If session completed by either party
        if (data.status === 'complete' && screen === 'active') {
          setScreen('complete');
        }
      }
    });

    return () => unsubscribe();
  }, [sessionId, screen]);

  /* ─── SYNCED TIMER CALCULATION ─── */
  useEffect(() => {
    if (screen !== 'active' || !sessionData?.startTime) return;

    // Clear any existing interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    const calculateTimeLeft = () => {
      const serverNow = Date.now() + serverTimeOffset;
      const endTime = sessionData.startTime! + (sessionData.duration * 60 * 1000);
      const remaining = Math.max(0, Math.floor((endTime - serverNow) / 1000));
      return remaining;
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
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

  /* ─── Animate ring/dot when timeLeft changes ─── */
  useEffect(() => {
    if (screen !== 'active') return;
    const frac = totalSeconds <= 0 ? 1 : 1 - timeLeft / totalSeconds;
    progress.value = withTiming(frac, { duration: 400, easing: Easing.linear });
    theta.value = withTiming(frac * 2 * Math.PI, { duration: 400, easing: Easing.linear });
  }, [timeLeft, totalSeconds, screen, progress, theta]);

  /* ─── Animated Props ─── */
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

  // Celebration bounce on complete
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

  // Listen for friend joining on share screen
  useEffect(() => {
    if (screen !== 'share' || !sessionId) return;

    const unsubscribe = listenForFriendJoin(sessionId, (joined) => {
      if (joined) {
        setFriendJoined(true);
      }
    });

    return () => unsubscribe();
  }, [screen, sessionId]);

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

  const handleCopy = () => Alert.alert('Copied!', 'Link copied to clipboard');

  const getStatusBadge = (status: string) => {
    if (status === 'focused') return { text: '✅ Focused', bg: '#E8F5E9', color: '#2e7d32' };
    if (status === 'away') return { text: '👀 Away', bg: '#FFF3E0', color: '#e65100' };
    return { text: '', bg: '#f0f0f0', color: '#666' };
  };

  // ─── HANDLE START SESSION (writes startTime to Firebase) ───
  const handleStartSession = async () => {
    try {
      // This writes the Firebase server timestamp as startTime
      await startSession(sessionId);
      // The listenToSession effect will pick up the startTime and start the timer
      setScreen('active');
    } catch (error) {
      Alert.alert('Error', 'Could not start session. Try again.');
    }
  };

  // ─── SCREEN 6: COMPLETION ─────────────────────────────────
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
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 28 }}>You and Sarah stayed focused</Text>

          {/* Points + Streak */}
          <View style={{ width: '100%', flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: '#2d7a6e' }}>+50</Text>
              <Text style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Points Earned</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: '#e67e22' }}>6 🔥</Text>
              <Text style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Day Streak</Text>
            </View>
          </View>

          {/* Session summary */}
          <View style={{ width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1a1a1a' }}>{task}</Text>
              <Text style={{ fontSize: 14, color: '#666' }}>{duration} min</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#2d7a6e' }} />
                <Text style={{ fontSize: 13, color: '#666' }}>You: {myViolations} violations</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#e67e22' }} />
                <Text style={{ fontSize: 13, color: '#666' }}>Sarah: {friendViolations}</Text>
              </View>
            </View>
          </View>

          {/* Rate buddy */}
          <View style={{ width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 28 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 12, textAlign: 'center' }}>Rate Sarah's focus</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Text style={{ fontSize: 32 }}>{star <= rating ? '⭐' : '☆'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Buttons */}
          <View style={{ width: '100%', gap: 12 }}>
            <TouchableOpacity
              style={{ backgroundColor: '#2d7a6e', borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
              onPress={() => {
                setTask('');
                setDuration(25);
                setRating(0);
                setFriendStatus('focused');
                setFriendViolations(0);
                setMyViolations(0);
                setFriendJoined(false);
                setSessionId('');
                setSessionLink('');
                setSessionData(null);
                setScreen('create');
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>Focus Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: '#fff', borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
              onPress={onBack}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1a1a1a' }}>Back Home</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    );
  }

  // ─── SCREEN 4 & 5: ACTIVE SESSION ─────────────────────────
  if (screen === 'active') {
    const myBadge = getStatusBadge('focused');
    const friendBadge = getStatusBadge(friendStatus);
    const bothFocused = friendStatus === 'focused';

    return (
      <View style={{ flex: 1, backgroundColor: '#f5f5f0', paddingTop: insets.top }}>

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
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#2d7a6e', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>Y</Text>
            </View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1a1a1a' }}>You</Text>
            <Text style={{ fontSize: 12, color: '#666', marginTop: 2, marginBottom: 8 }} numberOfLines={1}>{task}</Text>
            <View style={{ backgroundColor: myBadge.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: myBadge.color }}>{myBadge.text}</Text>
            </View>
            <Text style={{ fontSize: 11, color: '#999', marginTop: 8 }}>Violations: {myViolations}</Text>
          </View>

          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#e67e22', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>S</Text>
            </View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1a1a1a' }}>Sarah</Text>
            <Text style={{ fontSize: 12, color: '#666', marginTop: 2, marginBottom: 8 }} numberOfLines={1}>
              {sessionData?.friendTask || 'Study Math'}
            </Text>
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

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 }}>
          <TouchableOpacity onPress={() => setScreen('create')}>
            <Text style={{ fontSize: 28, color: '#1a1a1a' }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a' }}>Share & Wait</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={{ flex: 1, paddingHorizontal: 20, alignItems: 'center' }}>

          {/* Waiting OR Joined state */}
          {!friendJoined ? (
            <>
              <RNAnimated.View style={{ opacity: pulseAnim, marginTop: 32, marginBottom: 16 }}>
                <ActivityIndicator size="large" color="#2d7a6e" />
              </RNAnimated.View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 }}>Waiting for your friend...</Text>
              <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 32 }}>Share the link below so they can join</Text>
            </>
          ) : (
            <>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginTop: 32, marginBottom: 16 }}>
                <Text style={{ fontSize: 28 }}>✅</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#2e7d32', marginBottom: 6 }}>Friend joined!</Text>
              <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 32 }}>You're both ready to focus</Text>
            </>
          )}

          {/* Session summary */}
          <View style={{ width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#666', marginBottom: 6 }}>YOUR SESSION</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1a1a1a' }}>{task}</Text>
            <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>{duration} min · Starting when ready</Text>
          </View>

          {/* Link */}
          <View style={{ width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#666', marginBottom: 6 }}>SESSION LINK</Text>
            <Text style={{ fontSize: 14, color: '#2d7a6e' }} numberOfLines={1}>{sessionLink}</Text>
          </View>

          {/* Copy + Share buttons */}
          <View style={{ width: '100%', flexDirection: 'row', gap: 12, marginBottom: 24 }}>
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

          {/* Start Session button - only enabled when friend has joined */}
          <TouchableOpacity
            style={{
              backgroundColor: friendJoined ? '#2d7a6e' : '#ccc',
              borderRadius: 12,
              padding: 14,
              alignItems: 'center',
              width: '100%',
              marginBottom: 16,
            }}
            onPress={handleStartSession}
            disabled={!friendJoined}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>
              {friendJoined ? 'Start Session 🚀' : 'Waiting for friend...'}
            </Text>
          </TouchableOpacity>

          {/* Demo button for testing */}
          {!friendJoined && (
            <TouchableOpacity
              style={{ backgroundColor: '#f0f0f0', borderRadius: 12, padding: 14, alignItems: 'center', width: '100%', marginBottom: 16 }}
              onPress={() => setFriendJoined(true)}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#666' }}>📲 Demo: Simulate Friend Join</Text>
            </TouchableOpacity>
          )}

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

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 }}>
        <TouchableOpacity onPress={onBack}>
          <Text style={{ fontSize: 28, color: '#1a1a1a' }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a' }}>Focus with Friend</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ paddingHorizontal: 20 }}>

        <Text style={{ fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 10 }}>YOUR TASK</Text>
        <TextInput
          style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 24 }}
          placeholder="What are you working on?"
          placeholderTextColor="#999"
          defaultValue={task}
          onChangeText={setTask}
        />

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

        {/* Create button */}
        <TouchableOpacity
          style={{ backgroundColor: '#2d7a6e', borderRadius: 12, padding: 18, alignItems: 'center', opacity: task.trim() ? 1 : 0.5 }}
          onPress={async () => {
            if (!task.trim()) {
              Alert.alert('Enter a task', 'What are you working on?');
              return;
            }
            const id = generateSessionId();
            setSessionId(id);
            setSessionLink(`focushaven://buddy/${id}`);
            await createSession(id, task, duration);
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
