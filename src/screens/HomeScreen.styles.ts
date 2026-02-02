import { StyleSheet } from 'react-native';
import type { AppColors } from '../theme/theme';

/**
 * Responsive, themed styles
 * - top padding considers notch/status bar (topInset) and screen height
 * - horizontal padding scales with width
 * - bottom padding keeps content above tab bar & FAB (bottomInset)
 */
export const createHomeStyles = (
  colors: AppColors,
  width: number,
  height: number,
  topInset: number,
  bottomInset: number
) => {
  // horizontal padding ≈ 4% of width (min 16 / max 24)
  const hPad = Math.min(24, Math.max(16, Math.round(width * 0.04)));

  // base top space: a mix of safe area + small fraction of height
  // (gives a little breathing room on tall phones; stays tight on short ones)
  const topSpace = Math.max(topInset + 8, Math.round(height * 0.02));

  // list bottom padding to clear the tab bar + FAB comfortably
  const bottomSpace = Math.max(24, bottomInset + 96); // ~ tab + extra

  const radius = 12;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingHorizontal: hPad,
      paddingTop: topSpace,
    },

    // Toggle
    toggleContainer: {
      flexDirection: 'row',
      backgroundColor: colors.primaryBg,
      padding: 4,
      borderRadius: 12,
      alignSelf: 'center',
      marginBottom: 12,
      gap: 6,
    },
    toggleButton: {
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 10,
    },
    toggleText: {
      fontWeight: '600',
      color: colors.text,
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    activeText: {
      color: colors.card,
    },

    // List
    listContainer: {
      paddingBottom: bottomSpace,
      gap: 10,
    },

    // FAB
    addButton: {
      position: 'absolute',
      right: hPad,
      bottom: bottomInset + 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      elevation: 5,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
    },
      buddyButton: {
      position: 'absolute',
      left: hPad,
      right: hPad,
      bottom: bottomInset + 92,
      backgroundColor: colors.primaryBg,
      borderRadius: radius,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },
    buddyButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
  });
};
