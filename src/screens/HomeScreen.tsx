import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TaskCard from '../components/TaskCard';
import { styles } from './HomeScreen.styles';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Task = { id: string; title: string; icon: string };
type RootStackParamList = {
  Home: undefined;
  Timer: { task?: Task; tasks?: Task[]; autoStart?: boolean };
};
type HomeNav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeNav>();

  const [tab, setTab] = useState<'ToDo' | 'Done'>('ToDo');
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Other', icon: 'refresh-outline' },
  ]);

  const handleAddTask = () => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: `Task ${tasks.length + 1}`,
      icon: 'create-outline',
    };
    setTasks(prev => [...prev, newTask]);
  };

  return (
    <View style={styles.container}>
      {/* Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, tab === 'ToDo' && styles.activeTab]}
          onPress={() => setTab('ToDo')}
        >
          <Text style={[styles.toggleText, tab === 'ToDo' && styles.activeText]}>To Do</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, tab === 'Done' && styles.activeTab]}
          onPress={() => setTab('Done')}
        >
          <Text style={[styles.toggleText, tab === 'Done' && styles.activeText]}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Task List */}
      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TaskCard
            title={item.title}
            onStart={() =>
              navigation.navigate('Timer', {
                task: item,        // preselect this task
                tasks,             // show all tasks as chips on Timer
                autoStart: true,   // ⬅️ timer starts immediately
              })
            }
            onRename={(newTitle) => {
              setTasks(prev =>
                prev.map(t => (t.id === item.id ? { ...t, title: newTitle } : t))
              );
            }}
            onDelete={() => {
              setTasks(prev => prev.filter(t => t.id !== item.id));
            }}
          />
        )}
      />

      {/* Add Task */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;
