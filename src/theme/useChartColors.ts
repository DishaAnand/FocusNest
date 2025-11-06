// src/theme/useChartColors.ts
import { useAppTheme } from '../theme/ThemeProvider';
import { useColorScheme } from 'react-native';

// returns consistent chart colors based on theme (light/dark/system)
export function useChartColors() {
  const { mode } = useAppTheme();
  const system = useColorScheme();
  const effectiveMode = mode === 'system' ? system : mode;
  const isDark = effectiveMode === 'dark';

  return {
    axisLabel: isDark ? '#B0B0B0' : '#4A5A59',      // Y-axis text
    xAxisLabel: isDark ? '#CCCCCC' : '#0E1A19',     // X-axis text
    gridLine: isDark ? '#FFFFFF' : '#0B0B0B',       // grid line stroke
    gridOpacityMajor: 0.06,
    gridOpacityMinor: 0.03,
  };
}
