import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { joinSession } from '../services/sessionService';

interface Props {
  sessionId: string;
  onBack: () => void;
  onJoined: () => void;
}

const JoinScreen = ({ sessionId, onBack, onJoined }: Props) => {
  const insets = useSafeAreaInsets();
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await joinSession(sessionId);
      onJoined();
    } catch (e) {
      Alert.alert('Error', 'Could not join session. Try again.');
      setJoining(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f0', paddingTop: insets.top }}>

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 }}>
        <TouchableOpacity onPress={onBack}>
          <Text style={{ fontSize: 28, color: '#1a1a1a' }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a' }}>Join Session</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' }}>

        {/* Icon */}
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#2d7a6e', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 40 }}>👥</Text>
        </View>

        <Text style={{ fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 }}>Join Focus Session</Text>
        <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 8 }}>
          Your friend invited you to focus together
        </Text>

        {/* Session ID card */}
        <View style={{ width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 40, alignItems: 'center' }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#666', marginBottom: 6 }}>SESSION ID</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#2d7a6e' }}>{sessionId}</Text>
        </View>

        {/* Join button */}
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