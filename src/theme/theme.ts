// src/theme/theme.ts
import { DefaultTheme as NavLight, DarkTheme as NavDark, Theme as NavTheme } from '@react-navigation/native';

export type AppColors = {
  bg: string;
  card: string;
  text: string;
  muted: string;
  primary: string;
  primaryBg: string;
  border: string;
};

export const lightColors: AppColors = {
  bg: '#F8F7F3',
  card: '#FFFFFF',
  text: '#111111',
  muted: '#6B7280',
  primary: '#2b7a78',
  primaryBg: '#E0F2F1',
  border: '#E5E7EB',
};

export const darkColors: AppColors = {
  bg: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  muted: '#AAAAAA',
  primary: '#4DD0E1',
  primaryBg: '#1A2A2A',
  border: '#333333',
};

/**
 * Converts our AppColors to a React Navigation theme object
 * while keeping required fields like `fonts`, `animation`, etc.
 */
export const navThemeFromColors = (c: AppColors): NavTheme => {
  const base = c.bg === darkColors.bg ? NavDark : NavLight; // pick closest base
  return {
    ...base, // includes `fonts`, `animation`, etc.
    dark: base.dark,
    colors: {
      ...base.colors,
      primary: c.primary,
      background: c.bg,
      card: c.card,
      text: c.text,
      border: c.border,
      notification: c.primary,
    },
  };
};
