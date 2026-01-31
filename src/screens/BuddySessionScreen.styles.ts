import { StyleSheet } from 'react-native';
import type { AppColors } from '../theme/theme';

export const createBuddySessionStyles = (colors: AppColors) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
    },
    backText: {
      fontSize: 28,
      color: colors.text,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    section: {
      marginBottom: 24,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
      opacity: 0.6,
      marginBottom: 10,
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      fontSize: 16,
      color: colors.text,
    },
    tabs: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      padding: 4,
      borderRadius: 12,
      gap: 6,
    },
    tab: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
    },
    tabActive: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    tabTextActive: {
      color: colors.card,
    },
    tabLocked: {
      opacity: 0.5,
    },
    tabLockedText: {
      opacity: 0.6,
    },
    createButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 18,
      alignItems: 'center',
      marginTop: 32,
    },
    createButtonDisabled: {
      opacity: 0.5,
    },
    createButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.card,
    },
  });
};