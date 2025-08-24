import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  header: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 14,
  },
  navRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  chevBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  chev: { fontSize: 22, color: COLORS.muted, fontWeight: '700' },
  chevDisabled: { opacity: 0.3 },

  card: {
    marginTop: 18,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1,
  },
  cardCol: { flex: 1, alignItems: 'center' },
  divider: { width: 1, backgroundColor: COLORS.border, marginVertical: 4 },
  cardLabel: {
    color: COLORS.muted,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  cardLabelHidden: {
    color: 'transparent',
    marginBottom: 8,
  },
  subTitle: {
    color: COLORS.muted,
    fontWeight: '700',
    fontSize: 22,
    marginBottom: 6,
  },
  big: { color: COLORS.text, fontSize: 34, fontWeight: '800' },
});
