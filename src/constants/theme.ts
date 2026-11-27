import '@/global.css';
import { Platform } from 'react-native';

export const JasTipColors = {
  primary: '#26667F',
  primaryDark: '#1C4F62',
  primaryLight: '#397E9C',
  accent: '#F3D78A',
  accentDark: '#E4BF64',
  accentLight: '#FBF2D5',
  background: '#F0F5F8',
  card: '#FFFFFF',
  text: '#1C2E3B',
  textSecondary: '#667C8A',
  textMuted: '#9AB0BC',
  border: '#D9E5ED',
  borderDashed: '#B4CAD6',
  badgeBg: '#F3D78A',
  badgeText: '#6D520D',
  success: '#2B9A66',
  successLight: '#E8F7F0',
  danger: '#D9383A',
  dangerLight: '#FDECEC',
  white: '#FFFFFF',
};

export const Colors = {
  light: {
    text: JasTipColors.text,
    background: JasTipColors.background,
    backgroundElement: '#E7F0F5',
    backgroundSelected: '#D2E3ED',
    textSecondary: JasTipColors.textSecondary,
    tint: JasTipColors.primary,
  },
  dark: {
    text: '#FFFFFF',
    background: '#131F28',
    backgroundElement: '#1D2E3A',
    backgroundSelected: '#294050',
    textSecondary: '#A2BAC9',
    tint: JasTipColors.accent,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
