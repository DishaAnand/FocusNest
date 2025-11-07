// src/theme/ThemeProvider.tsx
import React from 'react';
import { Appearance, DeviceEventEmitter } from 'react-native';
import { darkColors, lightColors, navThemeFromColors, type AppColors } from './theme';
import {
  getAppearanceMode,
  setAppearanceMode,
  SETTINGS_CHANGED_EVENT,
  type AppearanceMode,
} from '../storage/settings';

type Ctx = {
  mode: AppearanceMode;                    // 'light' | 'dark' | 'system' (user choice)
  colorScheme: 'light' | 'dark';           // effective scheme being applied
  colors: AppColors;
  navTheme: ReturnType<typeof navThemeFromColors>;
  setMode: (m: AppearanceMode) => Promise<void>;
};

const ThemeContext = React.createContext<Ctx | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // what the user chose in Settings
  const [mode, setModeState] = React.useState<AppearanceMode>('system');

  // what the device currently is (light/dark)
  const [systemScheme, setSystemScheme] = React.useState<'light' | 'dark'>(
    (Appearance.getColorScheme() ?? 'light')
  );

  // load saved mode on mount
  React.useEffect(() => {
    getAppearanceMode().then(v => {
      if (v) setModeState(v);
    }).catch(() => {});
  }, []);

  // listen to system changes + settings changes
  React.useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme((colorScheme ?? 'light') as 'light' | 'dark');
    });
    const evt = DeviceEventEmitter.addListener(SETTINGS_CHANGED_EVENT, (e: any) => {
      if (e?.key === 'appearance') setModeState(e.value as AppearanceMode);
    });
    return () => {
      sub.remove();
      evt.remove();
    };
  }, []);

  // compute effective colors
  const effective: 'light' | 'dark' = mode === 'system' ? systemScheme : mode;
  const colors = effective === 'light' ? lightColors : darkColors;
  const navTheme = navThemeFromColors(colors);

  const setMode = React.useCallback(async (m: AppearanceMode) => {
    setModeState(m);
    await setAppearanceMode(m); // persists + emits SETTINGS_CHANGED_EVENT
  }, []);

  const value: Ctx = { mode, colorScheme: effective, colors, navTheme, setMode };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useAppTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
  return ctx;
}
