import { Platform } from 'react-native';

export const colors = {
  primary: '#5C4ACF',
  primaryDark: '#302477',
  primarySoft: '#EFECFF',
  primaryBorder: '#D8D1FF',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F6FD',
  text: '#17171F',
  textMuted: '#6F7381',
  border: '#E5E4ED',
  success: '#25B85A',
  successSoft: '#E8F8EE',
  danger: '#EF4444',
  dangerSoft: '#FDECEC',
  warning: '#D79512',
  warningSoft: '#FFF4D8',
  black: '#101014',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  huge: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const typography = {
  display: 30,
  title: 24,
  heading: 18,
  body: 14,
  small: 12,
  caption: 11,
} as const;

export const fonts = {
  regular: 'Roboto_400Regular',
  medium: 'Roboto_500Medium',
  bold: 'Roboto_700Bold',
  black: 'Roboto_900Black',
} as const;

export const shadow = Platform.select({
  ios: {
    shadowColor: '#302477',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 12,
  },
  default: { elevation: 2 },
});

// Compatibility exports for Expo template helpers that remain available during migration.
export const Colors = {
  light: { text: colors.text, background: colors.background, backgroundElement: colors.surfaceAlt, backgroundSelected: colors.primarySoft, textSecondary: colors.textMuted },
  dark: { text: colors.text, background: colors.background, backgroundElement: colors.surfaceAlt, backgroundSelected: colors.primarySoft, textSecondary: colors.textMuted },
};
export type ThemeColor = keyof typeof Colors.light;
export const Fonts = { sans: fonts.regular, serif: 'serif', rounded: fonts.medium, mono: 'monospace' };
export const Spacing = { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 };
export const BottomTabInset = 72;
export const MaxContentWidth = 800;
