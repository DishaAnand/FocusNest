import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  onBack: () => void;
}

const BuddySessionScreen = ({ onBack }: Props) => {
  const insets = useSafeAreaInsets();
  const [task, setTask] = useState('');
  const [duration, setDuration] = useState(25);

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
          value={task}
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
            Alert.alert('Created!', `Task: ${task}\nDuration: ${duration} min`);
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
