import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  Switch,
  Platform,
  Share,
  Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';

// theme + styles
import { useAppTheme } from '../theme/ThemeProvider';
import { createSettingsStyles } from './SettingsScreen.styles';

// storage helpers
import {
  getAutoStartBreak,
  setAutoStartBreak,
  getFocusMinutes,
  setFocusMinutes,
  getBreakMinutes,
  setBreakMinutes,
  getAppearanceMode,
  setAppearanceMode,
  getSoundKey,
  setSoundKey,
  type AppearanceMode,
} from '../storage/settings';

// sound catalog
import { SOUND_OPTIONS } from '../audio/sounds';

const DURATIONS_MIN = [1, 5, 10, 15, 20, 25, 30, 35, 45, 50, 60];

const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors, mode, setMode } = useAppTheme();
  const styles = createSettingsStyles(colors, width, insets.top);

  // persisted settings
  const [focusMin, setFocusMinState] = useState<number>(25);
  const [breakMin, setBreakMinState] = useState<number>(5);
  const [autoStartBreak, setAutoStartBreakState] = useState<boolean>(true);
  const [appearance, setAppearance] = useState<AppearanceMode>(mode);
  const [soundKey, setSoundKeyState] = useState<string>('beep');

  // local-only for now
  const [dailyReminder, setDailyReminder] = useState<boolean>(true);

  const [pickerVisible, setPickerVisible] =
    useState<null | 'focus' | 'break' | 'sound'>(null);

  // load persisted values on mount
  useEffect(() => {
    (async () => {
      try {
        const [fm, bm, asb, ap, sk] = await Promise.all([
          getFocusMinutes().catch(() => 25),
          getBreakMinutes().catch(() => 5),
          getAutoStartBreak().catch(() => true),
          getAppearanceMode().catch(() => 'system' as AppearanceMode),
          getSoundKey().catch(() => 'beep'),
        ]);
        setFocusMinState(fm);
        setBreakMinState(bm);
        setAutoStartBreakState(asb);
        setAppearance(ap);
        setSoundKeyState(sk);
      } catch {}
    })();
  }, []);

  const minutesLabel = (m: number) => `${m} min`;
  const onShare = async () => {
    try { await Share.share({ message: 'Focus 25 — a clean Pomodoro timer I’m using. Try it!' }); } catch {}
  };
  const onRate = () => {
    const url = Platform.OS === 'ios'
      ? 'itms-apps://itunes.apple.com/app/id0000000?action=write-review'
      : 'market://details?id=com.yourapp.bundle';
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.screen}>
        <Text style={styles.title}>Settings</Text>

        {/* Timer Preferences */}
        <Card styles={styles}>
          <CardHeader styles={styles}>Timer Preferences</CardHeader>

          <Row
            styles={styles}
            label="Focus Duration"
            value={minutesLabel(focusMin)}
            onPress={() => setPickerVisible('focus')}
          />
          <Divider styles={styles} />

          <Row
            styles={styles}
            label="Break Duration"
            value={minutesLabel(breakMin)}
            onPress={() => setPickerVisible('break')}
          />
          <Divider styles={styles} />

          <ToggleRow
            styles={styles}
            label="Auto-start Break"
            value={autoStartBreak}
            onValueChange={async (v) => {
              setAutoStartBreakState(v);
              try { await setAutoStartBreak(v); } catch {}
            }}
          />
        </Card>

        {/* General */}
        <Card styles={styles}>
          <CardHeader styles={styles}>General</CardHeader>

          <SegmentRow
            styles={styles}
            label="Appearance"
            value={appearance}
            onChange={async (m: AppearanceMode) => {
              setAppearance(m);
              try {
                await setAppearanceMode(m); // persist + notify
                await setMode(m);           // switch theme now
              } catch {}
            }}
            options={[
              { key: 'light', label: 'Light' },
              { key: 'dark', label: 'Dark' },
              { key: 'system', label: 'System' },
            ]}
          />
          <Divider styles={styles} />

          <ToggleRow
            styles={styles}
            label="Daily Reminder"
            value={dailyReminder}
            onValueChange={setDailyReminder}
          />
          <Divider styles={styles} />

          <Row
            styles={styles}
            label="Sound"
            value={SOUND_OPTIONS.find(s => s.key === soundKey)?.label ?? 'Beep'}
            onPress={() => setPickerVisible('sound')}
          />
        </Card>

        {/* About */}
        <Card styles={styles}>
          <Row
            styles={styles}
            label="Share App"
            right={<Ionicons name="chevron-forward" size={18} color={colors.muted} />}
            onPress={onShare}
          />
          <Divider styles={styles} />
          <Row
            styles={styles}
            label="Rate App"
            right={<Ionicons name="chevron-forward" size={18} color={colors.muted} />}
            onPress={onRate}
          />
          <Divider styles={styles} />
          <Row styles={styles} label="Version" value="1.0.0" disabled />
        </Card>
      </View>

      {/* Focus Duration */}
      <OptionSheet
        styles={styles}
        title="Focus Duration"
        visible={pickerVisible === 'focus'}
        options={DURATIONS_MIN.map((m) => ({ key: String(m), label: minutesLabel(m) }))}
        selectedKey={String(focusMin)}
        onClose={() => setPickerVisible(null)}
        onSelect={async (k) => {
          const m = Number(k);
          setFocusMinState(m);
          try { await setFocusMinutes(m); } catch {}
          setPickerVisible(null);
        }}
      />

      {/* Break Duration */}
      <OptionSheet
        styles={styles}
        title="Break Duration"
        visible={pickerVisible === 'break'}
        options={DURATIONS_MIN.map((m) => ({ key: String(m), label: minutesLabel(m) }))}
        selectedKey={String(breakMin)}
        onClose={() => setPickerVisible(null)}
        onSelect={async (k) => {
          const m = Number(k);
          setBreakMinState(m);
          try { await setBreakMinutes(m); } catch {}
          setPickerVisible(null);
        }}
      />

      {/* Sound */}
      <OptionSheet
        styles={styles}
        title="Sound"
        visible={pickerVisible === 'sound'}
        options={SOUND_OPTIONS.map(s => ({ key: s.key, label: s.label }))}
        selectedKey={soundKey}
        onClose={() => setPickerVisible(null)}
        onSelect={async (k) => {
          setSoundKeyState(k);
          try { await setSoundKey(k); } catch {}
          setPickerVisible(null);
        }}
      />
    </SafeAreaView>
  );
};

export default SettingsScreen;

/* ---------- tiny UI pieces ---------- */
const Card: React.FC<{ children: React.ReactNode; styles: any }> = ({ children, styles }) =>
  <View style={styles.card}>{children}</View>;

const CardHeader: React.FC<{ children: React.ReactNode; styles: any }> = ({ children, styles }) =>
  <Text style={styles.cardHeader}>{children}</Text>;

const Divider: React.FC<{ styles: any }> = ({ styles }) => <View style={styles.divider} />;

const Row: React.FC<{
  styles: any; label: string; value?: string; right?: React.ReactNode; onPress?: () => void; disabled?: boolean;
}> = ({ styles, label, value, right, onPress, disabled }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.row,
      disabled && { opacity: 0.6 },
      pressed && !disabled && { backgroundColor: 'rgba(0,0,0,0.03)' },
    ]}
  >
    <Text style={styles.rowLabel}>{label}</Text>
    <View style={styles.rowRight}>
      {!!value && <Text style={styles.rowValue}>{value}</Text>}
      {right ?? <Ionicons name="chevron-forward" size={18} color={styles.iconColor?.color ?? '#888'} />}
    </View>
  </Pressable>
);

const ToggleRow: React.FC<{
  styles: any; label: string; value: boolean; onValueChange: (v: boolean) => void;
}> = ({ styles, label, value, onValueChange }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Switch value={value} onValueChange={onValueChange} />
  </View>
);

const SegmentRow: React.FC<{
  styles: any; label: string; value: string; onChange: (k: any) => void; options: { key: string; label: string }[];
}> = ({ styles, label, value, onChange, options }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <View style={styles.segment}>
      {options.map((opt) => {
        const selected = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={({ pressed }) => [
              styles.segmentBtn,
              selected && styles.segmentBtnActive,
              pressed && { opacity: 0.9 },
            ]}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  </View>
);

const OptionSheet: React.FC<{
  styles: any; title: string; visible: boolean; options: { key: string; label: string }[];
  selectedKey?: string; onClose: () => void; onSelect: (key: string) => void;
}> = ({ styles, title, visible, options, selectedKey, onClose, onSelect }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={styles.sheetBackdrop} onPress={onClose} />
    <View style={styles.sheet}>
      <View style={styles.sheetHandle} />
      <Text style={styles.sheetTitle}>{title}</Text>
      <FlatList
        data={options}
        keyExtractor={(i) => i.key}
        renderItem={({ item }) => {
          const sel = item.key === selectedKey;
          return (
            <Pressable
              onPress={() => onSelect(item.key)}
              style={({ pressed }) => [
                styles.sheetItem,
                pressed && { backgroundColor: 'rgba(0,0,0,0.04)' },
              ]}
            >
              <Text style={styles.sheetItemText}>{item.label}</Text>
              {sel && <Ionicons name="checkmark" size={18} color={styles.primary?.color ?? '#0B8C7A'} />}
            </Pressable>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.sheetSep} />}
      />
      <Pressable onPress={onClose} style={styles.sheetCancel}>
        <Text style={styles.sheetCancelText}>Close</Text>
      </Pressable>
    </View>
  </Modal>
);
