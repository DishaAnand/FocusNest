import { StyleSheet } from 'react-native';

export const RADIUS = 100;
export const CIRCLE_LENGTH = 2 * Math.PI * RADIUS;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgWrapper: {
    width: RADIUS * 2,
    height: RADIUS * 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  timerText: {
    position: 'absolute',
    fontSize: 36,
    fontWeight: 'bold',
    color: '#111',
  },
  taskTag: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#D3F0EB',
    borderRadius: 20,
  },
  taskTagText: {
    fontWeight: 'bold',
    color: '#23766D',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '70%',
    marginTop: 30,
  },
  cancelText: {
    fontSize: 16,
    color: '#333',
  },
  startBtn: {
    backgroundColor: '#23766D',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
  },
  startText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
