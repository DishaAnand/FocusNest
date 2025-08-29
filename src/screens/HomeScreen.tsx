import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, DeviceEventEmitter } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TaskCard from '../components/TaskCard';
import { styles } from './HomeScreen.styles';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// ✅ task store (value + type)
import {
  getTasks as loadTasks,
  upsertTask,
  renameTask as renameStored,
  deleteTask as deleteStored,
  TASKS_CHANGED_EVENT,
} from '../storage/tasks';
import type { Task } from '../storage/tasks';

type RootStackParamList = {
  Home: undefined;
  Timer: { task?: Task; tasks?: Task[]; autoStart?: boolean };
};
type HomeNav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeNav>();

  const [tab, setTab] = useState<'ToDo' | 'Done'>('ToDo');
  const [tasks, setTasks] = useState<Task[]>([]);

  // initial load + keep in sync if another screen updates tasks
  useEffect(() => {
    let mounted = true;
    loadTasks().then(t => mounted && setTasks(t)).catch(() => {});
    const sub = DeviceEventEmitter.addListener(TASKS_CHANGED_EVENT, (updated: Task[]) => {
      setTasks(updated);
    });
    return () => { mounted = false; sub.remove(); };
  }, []);

  const handleAddTask = async () => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: `Task ${tasks.length + 1}`,
      icon: 'create-outline',
    };
    // optimistic
    setTasks(prev => [...prev, newTask]);
    try {
      const updated = await upsertTask(newTask);
      setTasks(updated);
    } catch {}
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
                // tasks: tasks,    // not required anymore; Timer reads from store
                autoStart: true,
              })
            }
            onRename={async (newTitle) => {
              // optimistic
              setTasks(prev => prev.map(t => (t.id === item.id ? { ...t, title: newTitle } : t)));
              try {
                const updated = await renameStored(item.id, newTitle);
                setTasks(updated);
              } catch {}
            }}
            onDelete={async () => {
              // optimistic
              setTasks(prev => prev.filter(t => t.id !== item.id));
              try {
                const updated = await deleteStored(item.id);
                setTasks(updated);
              } catch {}
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
