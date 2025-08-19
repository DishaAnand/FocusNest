import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { styles } from './TaskCard.styles';

export type TaskCardProps = {
  title: string;
  onStart?: () => void;                  // called when Start button is pressed
  onRename?: (newTitle: string) => void; // optional rename
  onDelete?: () => void;                 // triggered by swipe-to-delete
};

export default function TaskCard({ title, onStart, onDelete }: TaskCardProps) {
  const swipeRef = useRef<Swipeable>(null);

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.8],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => {
          swipeRef.current?.close();
          onDelete?.();
        }}
        activeOpacity={0.85}
      >
        <Animated.Text style={[styles.deleteText, { transform: [{ scale }] }]}>
          Delete
        </Animated.Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrapper}>
      <Swipeable
        ref={swipeRef}
        friction={2}
        rightThreshold={40}
        overshootRight={false}
        renderRightActions={renderRightActions}
      >
        <View style={styles.card}>
          <View style={styles.titleTapArea}>
            <Text style={styles.title}>{title}</Text>
          </View>

          <TouchableOpacity
            style={styles.startBtn}
            onPress={onStart}
            activeOpacity={0.85}
          >
            <Text style={styles.startText}>Start</Text>
          </TouchableOpacity>
        </View>
      </Swipeable>
    </View>
  );
}
