import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../theme/ThemeProvider';
import { createBuddySessionStyles } from './BuddySessionScreen.styles';

const BuddySessionScreen = () => {
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const styles = createBuddySessionStyles(colors);

  const [task, setTask] = useState('');
  const [duration, setDuration] = useState<25 | 50>(25);

  const handleCreate = () => {
    if (!task.trim()) {
      Alert.alert('Enter a task', 'Please enter what you want to focus on');
      return;
    }
    Alert.alert('Session Created!', `Task: ${task}\nDuration: ${duration} min`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Focus with Friend</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Task Input */}
        <View style={styles.section}>
          <Text style={styles.label}>YOUR TASK</Text>
          <TextInput
            style={styles.input}
            placeholder="What are you working on?"
            placeholderTextColor="#999"
            value={task}
            onChangeText={setTask}
            maxLength={50}
          />
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.label}>DURATION</Text>
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, duration === 25 && styles.tabActive]}
              onPress={() => setDuration(25)}
            >
              <Text style={[styles.tabText, duration === 25 && styles.tabTextActive]}>
                25 min
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, duration === 50 && styles.tabActive]}
              onPress={() => setDuration(50)}
            >
              <Text style={[styles.tabText, duration === 50 && styles.tabTextActive]}>
                50 min
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Start Time */}
        <View style={styles.section}>
          <Text style={styles.label}>START TIME</Text>
          <View style={styles.tabs}>
            <TouchableOpacity style={[styles.tab, styles.tabActive]}>
              <Text style={[styles.tabText, styles.tabTextActive]}>Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, styles.tabLocked]}
              onPress={() => Alert.alert('Premium', 'Coming soon!')}
            >
              <Text style={[styles.tabText, styles.tabLockedText]}>
                Schedule 🔒
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, !task.trim() && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={!task.trim()}
        >
          <Text style={styles.createButtonText}>Create & Share Link</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default BuddySessionScreen;