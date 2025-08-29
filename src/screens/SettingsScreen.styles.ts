import { StyleSheet } from 'react-native';

/**
 * Responsive styles
 * - width: drives paddings and radii
 * - topInset: pushes content below notch/status bar
 */
export const createSettingsStyles = (width: number, topInset: number) => {
  // horizontal padding ~4% of width, min 16 / max 24
  const hPad = Math.min(24, Math.max(16, Math.round(width * 0.04)));
  // card radius proportional to width
  const radius = Math.max(14, Math.round(width * 0.045));
  // vertical spacing scales a bit with width
  const vGap = Math.min(16, Math.max(10, Math.round(width * 0.02)));

  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: '#FCFAF4',
    },
    screen: {
      flex: 1,
      paddingTop: topInset + 8,   // ← keeps “Settings” comfortably below the notch
      paddingHorizontal: hPad,
      paddingBottom: 20,
      backgroundColor: '#FCFAF4',
    },
    title: {
      fontSize: Math.round(width * 0.07), // ~28 on 390w
      fontWeight: '700',
      color: '#12202E',
      marginBottom: vGap - 4,
    },
    card: {
      backgroundColor: '#FFFFFF',
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
      fontSize: Math.round(width * 0.035), // ~14
      fontWeight: '700',
      color: '#405261',
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
      fontSize: Math.round(width * 0.041), // ~16
      color: '#152534',
      fontWeight: '500',
    },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    rowValue: {
      fontSize: Math.round(width * 0.041),
      color: '#206B62',
      fontWeight: '600',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: '#E9ECEF',
      marginHorizontal: 6,
    },
    segment: {
      flexDirection: 'row',
      backgroundColor: '#EFF3F6',
      borderRadius: 10,
      padding: 2,
    },
    segmentBtn: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
    },
    segmentBtnActive: { backgroundColor: '#1A9C8B' },
    segmentText: {
      fontSize: Math.round(width * 0.033), // ~13
      fontWeight: '600',
      color: '#4B5B68',
    },
    segmentTextActive: { color: '#FFFFFF' },

    /* sheet */
    sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
    sheet: {
      backgroundColor: '#FFFFFF',
      paddingTop: 8,
      paddingBottom: 16,
      paddingHorizontal: hPad,
      borderTopLeftRadius: radius,
      borderTopRightRadius: radius,
    },
    sheetHandle: {
      alignSelf: 'center',
      width: 44, height: 5, borderRadius: 3, backgroundColor: '#E0E4E8', marginBottom: 8,
    },
    sheetTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: '#243542' },
    sheetItem: {
      height: 48,
      paddingHorizontal: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sheetItemText: { fontSize: 16, color: '#22313D' },
    sheetSep: { height: StyleSheet.hairlineWidth, backgroundColor: '#EEF1F4' },
    sheetCancel: { marginTop: 12, alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 18 },
    sheetCancelText: { fontSize: 16, fontWeight: '600', color: '#1A9C8B' },
  });
};
