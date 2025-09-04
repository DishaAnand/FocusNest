import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Swipeable } from 'react-native-gesture-handler';
import { styles } from './TaskCard.styles';

export type TaskCardProps = {
  title: string;
  onStart?: () => void;                  // Start button
  onRename?: (newTitle: string) => void; // kept for compatibility
  onDelete?: () => void;                 // swipe-to-delete
  onEditRequest?: () => void;            // tap pencil -> open rename modal
};

export default function TaskCard({
  title,
  onStart,
  onDelete,
  onEditRequest,
}: TaskCardProps) {
  const swipeRef = useRef<Swipeable>(null);

  // your original swipe-to-delete action
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

          {/* Right side: Start + Pencil (inside the same card) */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              style={styles.startBtn}
              onPress={onStart}
              activeOpacity={0.85}
            >
              <Text style={styles.startText}>Start</Text>
            </TouchableOpacity>

            {onEditRequest && (
              <TouchableOpacity
                onPress={onEditRequest}
                activeOpacity={0.85}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Rename task"
                testID="edit-task"
                // small, unobtrusive icon button
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#E0E0E0',
                  marginLeft: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="pencil-outline" size={18} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Swipeable>
    </View>
  );
}
