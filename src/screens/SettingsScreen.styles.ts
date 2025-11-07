import { StyleSheet } from 'react-native';
import type { AppColors } from '../theme/theme';
import { scale, verticalScale, moderateScale } from '../utils/responsive';

/**
 * Themed + responsive styles
 * Uses scale() helpers so text/padding scale gently across iPhone + iPad.
 */
export const createSettingsStyles = (colors: AppColors, width: number, topInset: number) => {
  const hPad = scale(20);
  const radius = scale(14);
  const vGap = verticalScale(14);

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    screen: {
      flex: 1,
      paddingTop: topInset + verticalScale(8),
      paddingHorizontal: hPad,
      paddingBottom: verticalScale(20),
      backgroundColor: colors.bg,
    },

    title: {
      fontSize: moderateScale(26),
      fontWeight: '700',
      color: colors.text,
      marginBottom: verticalScale(10),
    },

    card: {
      backgroundColor: colors.card,
      borderRadius: radius,
      paddingHorizontal: hPad,
      paddingVertical: verticalScale(8),
      marginBottom: vGap,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    cardHeader: {
      fontSize: moderateScale(16),
      fontWeight: '700',
      color: colors.text,
      marginBottom: verticalScale(6),
      paddingHorizontal: scale(4),
      paddingTop: verticalScale(6),
    },

    row: {
      minHeight: verticalScale(48),
      paddingHorizontal: scale(6),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rowLabel: {
      fontSize: moderateScale(15),
      color: colors.text,
      fontWeight: '500',
    },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: scale(8) },
    rowValue: {
      fontSize: moderateScale(15),
      color: colors.primary,
      fontWeight: '600',
    },

    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.primaryBg,
      marginHorizontal: scale(6),
    },

    segment: {
      flexDirection: 'row',
      backgroundColor: colors.primaryBg,
      borderRadius: scale(10),
      padding: scale(2),
    },
    segmentBtn: { paddingVertical: verticalScale(6), paddingHorizontal: scale(10), borderRadius: scale(8) },
    segmentBtnActive: { backgroundColor: colors.primary },
    segmentText: {
      fontSize: moderateScale(13),
      fontWeight: '600',
      color: colors.text,
    },
    segmentTextActive: { color: colors.card },

    /* bottom sheet */
    sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
    sheet: {
      backgroundColor: colors.card,
      paddingTop: verticalScale(8),
      paddingBottom: verticalScale(16),
      paddingHorizontal: hPad,
      borderTopLeftRadius: radius,
      borderTopRightRadius: radius,
    },
    sheetHandle: {
      alignSelf: 'center',
      width: scale(44),
      height: scale(5),
      borderRadius: scale(3),
      backgroundColor: colors.muted,
      opacity: 0.3,
      marginBottom: verticalScale(8),
    },
    sheetTitle: {
      fontSize: moderateScale(16),
      fontWeight: '700',
      marginBottom: verticalScale(8),
      color: colors.text,
    },
    sheetItem: {
      height: verticalScale(48),
      paddingHorizontal: scale(6),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sheetItemText: { fontSize: moderateScale(15), color: colors.text },
    sheetSep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.primaryBg },
    sheetCancel: {
      marginTop: verticalScale(12),
      alignSelf: 'center',
      paddingVertical: verticalScale(10),
      paddingHorizontal: scale(18),
      backgroundColor: colors.primaryBg,
      borderRadius: scale(10),
    },
    sheetCancelText: { fontSize: moderateScale(15), fontWeight: '600', color: colors.text },

    iconColor: { color: colors.muted },
    primary: { color: colors.primary },
  });
};
