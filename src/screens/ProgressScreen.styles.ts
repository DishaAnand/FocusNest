import { StyleSheet } from 'react-native';
import type { AppColors } from '../theme/theme';

export const createProgressStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    scrollContent: { paddingBottom: 28 },

    // nav
    navRow: {
      marginTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: { fontSize: 22, fontWeight: '700', color: colors.text },

    chevBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 1,
    },
    chev: { fontSize: 22, color: colors.muted, fontWeight: '700' },
    chevDisabled: { opacity: 0.3 },

    // overview card
    card: {
      marginTop: 18,
      backgroundColor: colors.card,
      borderRadius: 18,
      paddingVertical: 18,
      paddingHorizontal: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'stretch',
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 },
      elevation: 1,
    },
    cardCol: { flex: 1, alignItems: 'center' },
    divider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
    cardLabel: {
      color: colors.muted,
      fontWeight: '700',
      marginBottom: 8,
      letterSpacing: 0.5,
    },
    cardLabelHidden: {
      color: 'transparent',
      marginBottom: 8,
    },
    subTitle: {
      color: colors.muted,
      fontWeight: '700',
      fontSize: 22,
      marginBottom: 6,
    },
    big: { color: colors.text, fontSize: 34, fontWeight: '800' },

    // debug reset
    resetBtn: {
      alignSelf: 'center',
      marginTop: 12,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: colors.primaryBg,
    },
    resetText: {
      fontWeight: '600',
      color: colors.text,
    },
  });
