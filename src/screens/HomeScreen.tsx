import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  DeviceEventEmitter,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TaskCard from '../components/TaskCard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// responsive + theme
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';
import { createHomeStyles } from './HomeScreen.styles';
import { useAppTheme } from '../theme/ThemeProvider';

// task store
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
  BuddySession: undefined
};
type HomeNav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeNav>();

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { colors } = useAppTheme();
  const styles = createHomeStyles(colors, width, height, insets.top, insets.bottom);

  const [tab, setTab] = useState<'ToDo' | 'Done'>('ToDo');
  const [tasks, setTasks] = useState<Task[]>([]);

  // Edit modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const inputRef = useRef<TextInput>(null);

  // initial load + keep in sync
  useEffect(() => {
    let mounted = true;
    loadTasks().then(t => mounted && setTasks(t)).catch(() => { });
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
    setTasks(prev => [...prev, newTask]); // optimistic
    try {
      const updated = await upsertTask(newTask);
      setTasks(updated);
    } catch { }
  };

  // rename helpers
  const startEdit = (t: Task) => {
    setEditingTask(t);
    setEditingTitle(t.title);
    // small delay so modal mounts first then focuses
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditingTitle('');
  };

  const saveEdit = async () => {
    if (!editingTask) return;
    const nextTitle = editingTitle.trim();
    if (!nextTitle || nextTitle === editingTask.title) {
      cancelEdit();
      return;
    }

    // optimistic UI
    setTasks(prev => prev.map(x => (x.id === editingTask.id ? { ...x, title: nextTitle } : x)));

    try {
      const updated = await renameStored(editingTask.id, nextTitle);
      setTasks(updated);
    } catch {
      // revert on failure
      setTasks(prev => prev.map(x => (x.id === editingTask.id ? { ...x, title: editingTask.title } : x)));
    }
    cancelEdit();
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
              navigation.navigate('Timer', { task: item, autoStart: true })
            }
            onRename={async (newTitle) => {
              setTasks(prev => prev.map(t => (t.id === item.id ? { ...t, title: newTitle } : t)));
              try { setTasks(await renameStored(item.id, newTitle)); } catch { }
            }}
            onDelete={async () => {
              setTasks(prev => prev.filter(t => t.id !== item.id));
              try { setTasks(await deleteStored(item.id)); } catch { }
            }}
            onEditRequest={() => startEdit(item)}   // pencil inside TaskCard calls this
          />
        )}
      />
      <TouchableOpacity
        style={styles.buddyButton}
        onPress={() => navigation.navigate('BuddySession')}
        accessibilityLabel="Focus with friend"
      >
        <Text style={styles.buddyButtonText}>👥 Focus with Friend</Text>
      </TouchableOpacity>

      {/* Add Task (FAB) */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddTask} accessibilityLabel="Add task">
        <Ionicons name="add" size={28} color={colors.card} />
      </TouchableOpacity>

      {/* Rename Modal — simple + clean */}
      <Modal
        visible={!!editingTask}
        transparent
        animationType="fade"
        onRequestClose={cancelEdit}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={simpleStyles.fill}
        >
          <View style={simpleStyles.backdrop} />

          <View style={simpleStyles.center}>
            <View
              style={[
                simpleStyles.card,
                { backgroundColor: colors.card, borderColor: colors.border }
              ]}
            >
              <Text style={[simpleStyles.title, { color: colors.text }]}>Rename task</Text>

              <TextInput
                ref={inputRef}
                value={editingTitle}
                onChangeText={setEditingTitle}
                autoFocus
                placeholder="Task name"
                placeholderTextColor={'rgba(127,127,127,0.7)'}
                style={[
                  simpleStyles.input,
                  { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }
                ]}
                returnKeyType="done"
                onSubmitEditing={saveEdit}
                maxLength={80}
              />

              <View style={simpleStyles.actionsRow}>
                <TouchableOpacity
                  onPress={cancelEdit}
                  style={[simpleStyles.btn, { borderColor: colors.border, borderWidth: 1 }]}
                >
                  <Text style={{ color: colors.text }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={saveEdit}
                  disabled={
                    !editingTask ||
                    !editingTitle.trim() ||
                    editingTitle.trim() === editingTask.title
                  }
                  style={[
                    simpleStyles.btn,
                    {
                      borderColor: colors.border,
                      borderWidth: 1,
                      opacity: (!editingTask || !editingTitle.trim() ||
                        editingTitle.trim() === editingTask?.title) ? 0.6 : 1
                    }
                  ]}
                >
                  <Text style={{ color: colors.text, fontWeight: '600' }}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const simpleStyles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  center: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 15,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
    columnGap: 10,
  },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
});

export default HomeScreen;
