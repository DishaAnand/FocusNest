import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export const RING_STROKE  = 8;       // width of the progress ring
export const DOT_RADIUS   = 13;      // visible handle
export const RADIUS       = 130;     // size of the inner hole
export const OUTER        = RADIUS + RING_STROKE / 2 + DOT_RADIUS;
export const SIZE         = OUTER * 2;                 // total canvas
export const CENTER       = OUTER;                     // circle centre
export const CIRCLE_LEN   = 2 * Math.PI * RADIUS;

// 🎨 Focus palette
export const FOCUS_COLOR     = '#23766D'; // ring + dot stroke
export const FOCUS_BG        = '#23766D'; // primary/cancel buttons
export const FOCUS_CHIP_BG   = '#E6F3F1'; // chip base tint
export const FOCUS_CHIP_TEXT = '#23766D'; // chip text

// 🎨 Break palette (soft violet family)
export const BREAK_COLOR     = '#6B5B95'; // ring + dot stroke
export const BREAK_BG        = '#6B5B95'; // primary/cancel buttons
export const BREAK_CHIP_BG   = '#EFEAF6'; // chip base tint in break
export const BREAK_CHIP_TEXT = '#6B5B95'; // chip text in break

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* tiny chips row */
  chipsList: {
    maxHeight: 44,
  },
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
  chipTextActive: {
    color: '#fff',
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
    color: '#111',
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
