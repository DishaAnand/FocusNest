import { StyleSheet } from 'react-native';
import type { AppColors } from '../theme/theme';

// geometry
export const RING_STROKE  = 8;
export const DOT_RADIUS   = 13;
export const RADIUS       = 130;
export const OUTER        = RADIUS + RING_STROKE / 2 + DOT_RADIUS;
export const SIZE         = OUTER * 2;
export const CENTER       = OUTER;
export const CIRCLE_LEN   = 2 * Math.PI * RADIUS;

// Focus palette
export const FOCUS_COLOR     = '#23766D';
export const FOCUS_BG        = '#23766D';
export const FOCUS_CHIP_BG   = '#E6F3F1';
export const FOCUS_CHIP_TEXT = '#23766D';

// Break palette
export const BREAK_COLOR     = '#6B5B95';
export const BREAK_BG        = '#6B5B95';
export const BREAK_CHIP_BG   = '#EFEAF6';
export const BREAK_CHIP_TEXT = '#6B5B95';

export const createTimerStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,     // 👈 dark/light aware
      alignItems: 'center',
      justifyContent: 'center',
    },

    /* chips row */
    chipsList: { maxHeight: 44 },
    chip: {
      height: 32,
      paddingHorizontal: 12,
      borderRadius: 16,
      alignSelf: 'center',
      justifyContent: 'center',
      alignItems: 'center',
    },
    chipText: {
      fontSize: 13,
      fontWeight: '700',
    },
    chipTextActive: { color: '#fff' },

    /* phase label */
    phaseText: {
      marginTop: 8,
      fontWeight: '600',
    },

    /* timer */
    svgWrapper: {
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 20,
    },
    timerText: {
      position: 'absolute',
      fontSize: 60,
      color: colors.text,             // 👈 dark/light aware
      fontWeight: '500',
    },

    /* buttons */
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '70%',
      marginTop: 30,
    },
    startBtn: {
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 999,
    },
    startText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  });
