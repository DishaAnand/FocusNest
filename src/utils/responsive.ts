import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');
const guidelineBaseWidth = 390;
const guidelineBaseHeight = 844;

// Detect large screen (iPad or similar)
const isLargeScreen = width >= 768;

export const scale = (size: number) => {
  const scaled = (width / guidelineBaseWidth) * size;
  // reduce scaling factor for iPad
  return isLargeScreen ? size + (scaled - size) * 0.5 : scaled;
};

export const verticalScale = (size: number) => {
  const scaled = (height / guidelineBaseHeight) * size;
  return isLargeScreen ? size + (scaled - size) * 0.5 : scaled;
};

export const moderateScale = (size: number, factor = 0.5) => {
  const scaled = scale(size);
  const adjusted = size + (scaled - size) * factor;
  return isLargeScreen ? adjusted * 0.9 : adjusted;
};
