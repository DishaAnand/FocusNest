import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export const styles = StyleSheet.create({
  /** outer shell clips card + delete */
  wrapper: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  /** inner white card */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
  },

  /* ----- text / input ----- */
  titleTapArea: { maxWidth: '65%' },
  title: { fontSize: 16, color: '#222' },

  input: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#fff',
    minWidth: 160,
  },

  /* ----- buttons ----- */
  startBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
  },
  startText: { color: '#fff', fontWeight: '600' },

  saveBtn: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 16,
  },
  saveText: { color: '#fff', fontWeight: '600' },

  /* ----- swipe-to-delete ------- */
  deleteBtn: {
    backgroundColor: '#FF5C5C',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: '100%',
  },
  deleteText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
