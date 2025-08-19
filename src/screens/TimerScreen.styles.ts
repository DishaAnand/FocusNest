import { StyleSheet } from 'react-native';

export const RING_STROKE  = 8;       // width of the progress ring
export const DOT_RADIUS   = 13;      // visible handle
export const RADIUS       = 130;     // size of the inner hole
export const OUTER        = RADIUS + RING_STROKE / 2 + DOT_RADIUS;
export const SIZE         = OUTER * 2;                 // total canvas
export const CENTER       = OUTER;                     // circle centre
export const CIRCLE_LEN   = 2 * Math.PI * RADIUS;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* tiny chips row */
  chipsList: {
    maxHeight: 44,                 // cap overall height of the row
  },
  chip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#E6F3F1',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: '#23766D',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#23766D',
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

  /* buttons (unchanged) */
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '70%',
    marginTop: 30,
  },
  startBtn: {
    backgroundColor: '#23766D',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
  },
  startText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
