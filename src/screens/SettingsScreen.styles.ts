import { StyleSheet } from 'react-native';
import type { AppColors } from '../theme/theme';

/**
 * Themed + responsive styles
 * - colors from ThemeProvider (light/dark/system)
 * - width/topInset for comfy spacing on any device
 */
export const createSettingsStyles = (colors: AppColors, width: number, topInset: number) => {
  const hPad = Math.min(24, Math.max(16, Math.round(width * 0.04)));
  const radius = Math.max(14, Math.round(width * 0.045));
  const vGap = Math.min(16, Math.max(10, Math.round(width * 0.02)));

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    screen: {
      flex: 1,
      paddingTop: topInset + 8,
      paddingHorizontal: hPad,
      paddingBottom: 20,
      backgroundColor: colors.bg,
    },
    title: {
      fontSize: Math.round(width * 0.07),
      fontWeight: '700',
      color: colors.text,
      marginBottom: vGap - 4,
    },

    card: {
      backgroundColor: colors.card,
      borderRadius: radius,
      paddingHorizontal: hPad - 2,
      paddingVertical: 8,
      marginBottom: vGap,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    cardHeader: {
      fontSize: Math.round(width * 0.035),
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
      paddingHorizontal: 4,
      paddingTop: 6,
    },

    row: {
      minHeight: 48,
      paddingHorizontal: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rowLabel: {
      fontSize: Math.round(width * 0.041),
      color: colors.text,
      fontWeight: '500',
    },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    rowValue: {
      fontSize: Math.round(width * 0.041),
      color: colors.primary,
      fontWeight: '600',
    },

    divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.primaryBg, marginHorizontal: 6 },

    segment: { flexDirection: 'row', backgroundColor: colors.primaryBg, borderRadius: 10, padding: 2 },
    segmentBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
    segmentBtnActive: { backgroundColor: colors.primary },
    segmentText: { fontSize: Math.round(width * 0.033), fontWeight: '600', color: colors.text },
    segmentTextActive: { color: colors.card },

    /* bottom sheet */
    sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
    sheet: {
      backgroundColor: colors.card,
      paddingTop: 8,
      paddingBottom: 16,
      paddingHorizontal: hPad,
      borderTopLeftRadius: radius,
      borderTopRightRadius: radius,
    },
    sheetHandle: {
      alignSelf: 'center',
      width: 44, height: 5, borderRadius: 3, backgroundColor: colors.muted, opacity: 0.3, marginBottom: 8,
    },
    sheetTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: colors.text },
    sheetItem: {
      height: 48,
      paddingHorizontal: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sheetItemText: { fontSize: 16, color: colors.text },
    sheetSep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.primaryBg },
    sheetCancel: {
      marginTop: 12,
      alignSelf: 'center',
      paddingVertical: 10,
      paddingHorizontal: 18,
      backgroundColor: colors.primaryBg,
      borderRadius: 10,
    },
    sheetCancelText: { fontSize: 16, fontWeight: '600', color: colors.text },

    // helpers for inline icon colors from theme when needed by the TSX
    iconColor: { color: colors.muted },
    primary: { color: colors.primary },
  });
};
