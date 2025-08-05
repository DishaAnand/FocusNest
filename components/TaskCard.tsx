import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { styles } from './TaskCard.styles';

interface TaskCardProps {
  title: string;
  onRename: (newTitle: string) => void;
  onDelete: () => void;
}

export default function TaskCard({ title, onRename, onDelete }: TaskCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  /* keep TextInput synced if parent changes the title */
  useEffect(() => setDraft(title), [title]);

  const save = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== title) onRename(trimmed);
    setEditing(false);
  };

  /** right-side “Delete” slab */
  const renderRight = () => (
    <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );

  /** Disable swipe while editing so TextInput is tappable */
  const swipeableRef = useRef<Swipeable>(null);

  return (
    <View style={styles.wrapper}>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={editing ? undefined : renderRight}
        enabled={!editing}
        overshootRight={false}
      >
        <View style={styles.card}>
          {/* title / editor */}
          {editing ? (
            <TextInput
              value={draft}
              onChangeText={setDraft}
              style={styles.input}
              autoFocus
              placeholder="Edit task..."
              returnKeyType="done"
              onSubmitEditing={save}
              blurOnSubmit
            />
          ) : (
            <TouchableOpacity
              style={styles.titleTapArea}
              onPress={() => setEditing(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.title}>{title}</Text>
            </TouchableOpacity>
          )}

          {/* right-hand button */}
          {editing ? (
            <TouchableOpacity style={styles.saveBtn} onPress={save}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.startBtn}>
              <Text style={styles.startText}>Start</Text>
            </TouchableOpacity>
          )}
        </View>
      </Swipeable>
    </View>
  );
}
