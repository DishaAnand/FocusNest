import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TaskCard from '../components/TaskCard';
import { styles } from './HomeScreen.styles.ts';

const HomeScreen = () => {
    const [tab, setTab] = useState<'ToDo' | 'Done'>('ToDo');

    const [tasks, setTasks] = useState([
        { id: '1', title: 'Other', icon: 'refresh-outline' }
    ]);

    const handleAddTask = () => {
        // For now we just add a dummy task
        const newTask = {
            id: Date.now().toString(),
            title: `Task ${tasks.length + 1}`,
            icon: 'create-outline'
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
                renderItem={({ item }) => (
                    <TaskCard
                        title={item.title}
                        onRename={(newTitle) => {
                            setTasks(prev =>
                                prev.map(task =>
                                    task.id === item.id ? { ...task, title: newTitle } : task
                                )
                            );
                        }}
                        onDelete={() => {
                            setTasks(prev => prev.filter(task => task.id !== item.id));
                        }}
                    />
                )}


                contentContainerStyle={styles.listContainer}
            />

            {/* Add Task Button */}
            <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

export default HomeScreen;
