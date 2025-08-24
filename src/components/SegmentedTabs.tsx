import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

type Props = { tabs: string[]; value: string; onChange: (v: string) => void };

export default function SegmentedTabs({ tabs, value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      {tabs.map(t => {
        const active = t === value;
        return (
          <Pressable key={t} onPress={() => onChange(t)} style={[styles.tab, active && styles.active]}>
            <Text style={[styles.label, active && styles.activeLabel]}>{t}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: '#F5EDE4',
    padding: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  active: {
    backgroundColor: COLORS.primary2,
  },
  label: {
    color: COLORS.muted,
    fontWeight: '600',
    fontSize: 16,
  },
  activeLabel: {
    color: 'white',
  },
});
