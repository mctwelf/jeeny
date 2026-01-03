/**
 * GoCap Theme Configuration
 * Design system based on the Behance UI/UX mockups
 * Supports RTL (Arabic), LTR (French, English), and Dark/Light modes
 */

import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (based on design mockups - iPhone 14 Pro)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

// ==================== RESPONSIVE HELPERS ====================

/**
 * Scale a value based on screen width
 */
export const scale = (size: number): number => {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
};

/**
 * Scale a value based on screen height
 */
export const verticalScale = (size: number): number => {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
};

/**
 * Moderate scale - less aggressive scaling for text
 */
export const moderateScale = (size: number, factor: number = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

/**
 * Normalize font size across platforms
 */
export const normalizeFont = (size: number): number => {
  const newSize = scale(size);
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
};

// ==================== COLORS ====================

export const colors = {
  // Primary Brand Colors (Yellow theme from design)
  primary: {
    50: '#FFFDE7',
    100: '#FFF9C4',
    200: '#FFF59D',
    300: '#FFF176',
    400: '#FFEE58',
    500: '#FFD600', // Main brand yellow
    600: '#FFC107',
    700: '#FFB300',
    800: '#FFA000',
    900: '#FF8F00',
    main: '#FFD600',
    light: '#FFEB3B',
    dark: '#FFC107',
    contrastText: '#000000',
  },

  // Secondary Colors (Dark Navy from design)
  secondary: {
    50: '#E8EAF6',
    100: '#C5CAE9',
    200: '#9FA8DA',
    300: '#7986CB',
    400: '#5C6BC0',
    500: '#1A1A2E', // Main dark navy
    600: '#16213E',
    700: '#0F0F1A',
    800: '#0A0A12',
    900: '#050508',
    main: '#1A1A2E',
    light: '#16213E',
    dark: '#0F0F1A',
    contrastText: '#FFFFFF',
  },

  // Neutral/Gray Colors
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
    1000: '#000000',
  },

  // Semantic Colors
  success: {
    light: '#E8F5E9',
    main: '#4CAF50',
    dark: '#388E3C',
    contrastText: '#FFFFFF',
  },

  warning: {
    light: '#FFF3E0',
    main: '#FF9800',
    dark: '#F57C00',
    contrastText: '#000000',
  },

  error: {
    light: '#FFEBEE',
    main: '#F44336',
    dark: '#D32F2F',
    contrastText: '#FFFFFF',
  },

  info: {
    light: '#E3F2FD',
    main: '#2196F3',
    dark: '#1976D2',
    contrastText: '#FFFFFF',
  },

  // Map Colors
  map: {
    route: '#FFD600',
    routeAlternate: '#1A1A2E',
    pickup: '#4CAF50',
    dropoff: '#F44336',
    stop: '#FF9800',
    driver: '#FFD600',
    driverRadius: 'rgba(255, 214, 0, 0.15)',
    traffic: {
      low: '#4CAF50',
      medium: '#FF9800',
      high: '#F44336',
    },
  },

  // Vehicle Type Colors
  vehicle: {
    economy: '#4CAF50',
    comfort: '#2196F3',
    business: '#9C27B0',
    van: '#FF9800',
    luxury: '#FFD600',
  },

  // Payment Provider Colors
  payment: {
    bankily: '#00A859',
    sedad: '#1E3A8A',
    masrvi: '#E31837',
    cash: '#4CAF50',
  },

  // Social Colors
  social: {
    facebook: '#1877F2',
    google: '#DB4437',
    apple: '#000000',
    whatsapp: '#25D366',
  },

  // Rating
  rating: {
    filled: '#FFD600',
    empty: '#E0E0E0',
    half: '#FFD600',
  },

  // Common
  common: {
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
  },

  // Overlay
  overlay: {
    light: 'rgba(255, 255, 255, 0.5)',
    medium: 'rgba(0, 0, 0, 0.5)',
    dark: 'rgba(0, 0, 0, 0.7)',
    darker: 'rgba(0, 0, 0, 0.85)',
  },
} as const;

// ==================== LIGHT THEME ====================

export const lightTheme = {
  dark: false,
  colors: {
    primary: colors.primary.main,
    background: colors.neutral[0],
    card: colors.neutral[0],
    text: colors.secondary.main,
    border: colors.neutral[300],
    notification: colors.error.main,

    // Extended colors
    surface: colors.neutral[50],
    surfaceVariant: colors.neutral[100],
    onPrimary: colors.primary.contrastText,
    onSecondary: colors.secondary.contrastText,
    onBackground: colors.secondary.main,
    onSurface: colors.secondary.main,
    onSurfaceVariant: colors.neutral[600],
    outline: colors.neutral[300],
    outlineVariant: colors.neutral[200],
    shadow: colors.common.black,
    scrim: colors.overlay.medium,
    inverseSurface: colors.secondary.main,
    inverseOnSurface: colors.neutral[0],
    inversePrimary: colors.primary.light,
    surfaceDisabled: colors.neutral[200],
    onSurfaceDisabled: colors.neutral[500],
    backdrop: colors.overlay.medium,

    // Text variants
    textPrimary: colors.secondary.main,
    textSecondary: colors.neutral[600],
    textTertiary: colors.neutral[500],
    textDisabled: colors.neutral[400],
    textPlaceholder: colors.neutral[400],
    textInverse: colors.neutral[0],
    textLink: colors.primary.main,
    textError: colors.error.main,
    textSuccess: colors.success.main,

    // Input/Form
    inputBackground: colors.neutral[50],
    inputBorder: colors.neutral[300],
    inputBorderFocused: colors.primary.main,
    inputText: colors.secondary.main,
    inputPlaceholder: colors.neutral[400],
    inputError: colors.error.main,

    // Button
    buttonPrimary: colors.primary.main,
    buttonPrimaryText: colors.primary.contrastText,
    buttonSecondary: colors.secondary.main,
    buttonSecondaryText: colors.secondary.contrastText,
    buttonDisabled: colors.neutral[300],
    buttonDisabledText: colors.neutral[500],
    buttonOutline: colors.primary.main,
    buttonOutlineText: colors.primary.main,
    buttonGhost: 'transparent',
    buttonGhostText: colors.primary.main,

    // Card
    cardBackground: colors.neutral[0],
    cardBorder: colors.neutral[200],
    cardShadow: 'rgba(0, 0, 0, 0.08)',

    // Divider
    divider: colors.neutral[200],
    dividerLight: colors.neutral[100],

    // Status bar
    statusBar: colors.neutral[0],
    statusBarContent: 'dark-content',

    // Tab bar
    tabBarBackground: colors.neutral[0],
    tabBarBorder: colors.neutral[200],
    tabBarActive: colors.primary.main,
    tabBarInactive: colors.neutral[500],

    // Header
    headerBackground: colors.neutral[0],
    headerText: colors.secondary.main,
    headerBorder: colors.neutral[200],
  },
} as const;

// ==================== DARK THEME ====================

export const darkTheme = {
  dark: true,
  colors: {
    primary: colors.primary.main,
    background: colors.secondary.dark,
    card: colors.secondary.main,
    text: colors.neutral[0],
    border: colors.neutral[800],
    notification: colors.error.main,

    // Extended colors
    surface: colors.secondary.main,
    surfaceVariant: colors.secondary.light,
    onPrimary: colors.primary.contrastText,
    onSecondary: colors.secondary.contrastText,
    onBackground: colors.neutral[0],
    onSurface: colors.neutral[0],
    onSurfaceVariant: colors.neutral[400],
    outline: colors.neutral[700],
    outlineVariant: colors.neutral[800],
    shadow: colors.common.black,
    scrim: colors.overlay.dark,
    inverseSurface: colors.neutral[100],
    inverseOnSurface: colors.secondary.main,
    inversePrimary: colors.primary.dark,
    surfaceDisabled: colors.neutral[800],
    onSurfaceDisabled: colors.neutral[600],
    backdrop: colors.overlay.dark,

    // Text variants
    textPrimary: colors.neutral[0],
    textSecondary: colors.neutral[300],
    textTertiary: colors.neutral[400],
    textDisabled: colors.neutral[600],
    textPlaceholder: colors.neutral[500],
    textInverse: colors.secondary.main,
    textLink: colors.primary.main,
    textError: colors.error.light,
    textSuccess: colors.success.light,

    // Input/Form
    inputBackground: colors.secondary.light,
    inputBorder: colors.neutral[700],
    inputBorderFocused: colors.primary.main,
    inputText: colors.neutral[0],
    inputPlaceholder: colors.neutral[500],
    inputError: colors.error.main,

    // Button
    buttonPrimary: colors.primary.main,
    buttonPrimaryText: colors.primary.contrastText,
    buttonSecondary: colors.neutral[100],
    buttonSecondaryText: colors.secondary.main,
    buttonDisabled: colors.neutral[700],
    buttonDisabledText: colors.neutral[500],
    buttonOutline: colors.primary.main,
    buttonOutlineText: colors.primary.main,
    buttonGhost: 'transparent',
    buttonGhostText: colors.primary.main,

    // Card
    cardBackground: colors.secondary.main,
    cardBorder: colors.neutral[800],
    cardShadow: 'rgba(0, 0, 0, 0.3)',

    // Divider
    divider: colors.neutral[800],
    dividerLight: colors.neutral[700],

    // Status bar
    statusBar: colors.secondary.dark,
    statusBarContent: 'light-content',

    // Tab bar
    tabBarBackground: colors.secondary.main,
    tabBarBorder: colors.neutral[800],
    tabBarActive: colors.primary.main,
    tabBarInactive: colors.neutral[500],

    // Header
    headerBackground: colors.secondary.main,
    headerText: colors.neutral[0],
    headerBorder: colors.neutral[800],
  },
} as const;

// ==================== TYPOGRAPHY ====================

export const typography = {
  // Font families (Gilroy)
  fontFamily: {
    thin: 'Gilroy-Thin',
    thinItalic: 'Gilroy-ThinItalic',
    ultraLight: 'Gilroy-UltraLight',
    ultraLightItalic: 'Gilroy-UltraLightItalic',
    light: 'Gilroy-Light',
    lightItalic: 'Gilroy-LightItalic',
    regular: 'Gilroy-Regular',
    regularItalic: 'Gilroy-RegularItalic',
    medium: 'Gilroy-Medium',
    mediumItalic: 'Gilroy-MediumItalic',
    semiBold: 'Gilroy-SemiBold',
    semiBoldItalic: 'Gilroy-SemiBoldItalic',
    bold: 'Gilroy-Bold',
    boldItalic: 'Gilroy-BoldItalic',
    extraBold: 'Gilroy-ExtraBold',
    extraBoldItalic: 'Gilroy-ExtraBoldItalic',
    heavy: 'Gilroy-Heavy',
    heavyItalic: 'Gilroy-HeavyItalic',
    black: 'Gilroy-Black',
    blackItalic: 'Gilroy-BlackItalic',
  },

  // Font weights (numeric values for cross-platform consistency)
  fontWeight: {
    thin: '100' as const,
    ultraLight: '200' as const,
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
    black: '900' as const,
  },

  // Font sizes (in points)
  fontSize: {
    '2xs': normalizeFont(10),
    xs: normalizeFont(12),
    sm: normalizeFont(14),
    base: normalizeFont(16),
    lg: normalizeFont(18),
    xl: normalizeFont(20),
    '2xl': normalizeFont(24),
    '3xl': normalizeFont(28),
    '4xl': normalizeFont(32),
    '5xl': normalizeFont(40),
    '6xl': normalizeFont(48),
    '7xl': normalizeFont(56),
    '8xl': normalizeFont(64),
  },

  // Line heights (multipliers)
  lineHeight: {
    none: 1,
    tight: 1.2,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter spacing
  letterSpacing: {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.4,
    wider: 0.8,
    widest: 1.6,
  },

  // Pre-defined text styles
  variants: {
    // Display (Large titles)
    displayLarge: {
      fontFamily: 'Gilroy-Bold',
      fontSize: normalizeFont(48),
      lineHeight: 1.2,
      letterSpacing: -0.4,
    },
    displayMedium: {
      fontFamily: 'Gilroy-Bold',
      fontSize: normalizeFont(40),
      lineHeight: 1.2,
      letterSpacing: -0.4,
    },
    displaySmall: {
      fontFamily: 'Gilroy-Bold',
      fontSize: normalizeFont(32),
      lineHeight: 1.2,
      letterSpacing: 0,
    },

    // Headlines
    headlineLarge: {
      fontFamily: 'Gilroy-SemiBold',
      fontSize: normalizeFont(28),
      lineHeight: 1.3,
      letterSpacing: 0,
    },
    headlineMedium: {
      fontFamily: 'Gilroy-SemiBold',
      fontSize: normalizeFont(24),
      lineHeight: 1.3,
      letterSpacing: 0,
    },
    headlineSmall: {
      fontFamily: 'Gilroy-SemiBold',
      fontSize: normalizeFont(20),
      lineHeight: 1.3,
      letterSpacing: 0,
    },

    // Titles
    titleLarge: {
      fontFamily: 'Gilroy-Medium',
      fontSize: normalizeFont(20),
      lineHeight: 1.4,
      letterSpacing: 0,
    },
    titleMedium: {
      fontFamily: 'Gilroy-Medium',
      fontSize: normalizeFont(18),
      lineHeight: 1.4,
      letterSpacing: 0.15,
    },
    titleSmall: {
      fontFamily: 'Gilroy-Medium',
      fontSize: normalizeFont(16),
      lineHeight: 1.4,
      letterSpacing: 0.1,
    },

    // Body text
    bodyLarge: {
      fontFamily: 'Gilroy-Regular',
      fontSize: normalizeFont(16),
      lineHeight: 1.5,
      letterSpacing: 0.15,
    },
    bodyMedium: {
      fontFamily: 'Gilroy-Regular',
      fontSize: normalizeFont(14),
      lineHeight: 1.5,
      letterSpacing: 0.25,
    },
    bodySmall: {
      fontFamily: 'Gilroy-Regular',
      fontSize: normalizeFont(12),
      lineHeight: 1.5,
      letterSpacing: 0.4,
    },

    // Labels
    labelLarge: {
      fontFamily: 'Gilroy-Medium',
      fontSize: normalizeFont(14),
      lineHeight: 1.4,
      letterSpacing: 0.1,
    },
    labelMedium: {
      fontFamily: 'Gilroy-Medium',
      fontSize: normalizeFont(12),
      lineHeight: 1.4,
      letterSpacing: 0.5,
    },
    labelSmall: {
      fontFamily: 'Gilroy-Medium',
      fontSize: normalizeFont(10),
      lineHeight: 1.4,
      letterSpacing: 0.5,
    },

    // Buttons
    buttonLarge: {
      fontFamily: 'Gilroy-SemiBold',
      fontSize: normalizeFont(18),
      lineHeight: 1.2,
      letterSpacing: 0.5,
    },
    buttonMedium: {
      fontFamily: 'Gilroy-SemiBold',
      fontSize: normalizeFont(16),
      lineHeight: 1.2,
      letterSpacing: 0.5,
    },
    buttonSmall: {
      fontFamily: 'Gilroy-SemiBold',
      fontSize: normalizeFont(14),
      lineHeight: 1.2,
      letterSpacing: 0.5,
    },

    // Caption
    caption: {
      fontFamily: 'Gilroy-Regular',
      fontSize: normalizeFont(12),
      lineHeight: 1.4,
      letterSpacing: 0.4,
    },

    // Overline
    overline: {
      fontFamily: 'Gilroy-Medium',
      fontSize: normalizeFont(10),
      lineHeight: 1.5,
      letterSpacing: 1.5,
      textTransform: 'uppercase' as const,
    },
  },
} as const;

// ==================== SPACING ====================

export const spacing = {
  0: 0,
  px: 1,
  0.5: scale(2),
  1: scale(4),
  1.5: scale(6),
  2: scale(8),
  2.5: scale(10),
  3: scale(12),
  3.5: scale(14),
  4: scale(16),
  5: scale(20),
  6: scale(24),
  7: scale(28),
  8: scale(32),
  9: scale(36),
  10: scale(40),
  11: scale(44),
  12: scale(48),
  14: scale(56),
  16: scale(64),
  20: scale(80),
  24: scale(96),
  28: scale(112),
  32: scale(128),
  36: scale(144),
  40: scale(160),
  44: scale(176),
  48: scale(192),
  52: scale(208),
  56: scale(224),
  60: scale(240),
  64: scale(256),
  72: scale(288),
  80: scale(320),
  96: scale(384),
} as const;

// ==================== BORDER RADIUS ====================

export const borderRadius = {
  none: 0,
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(20),
  '2xl': scale(24),
  '3xl': scale(32),
  '4xl': scale(40),
  full: 9999,

  // Component specific
  button: scale(12),
  buttonSmall: scale(8),
  buttonLarge: scale(16),
  card: scale(16),
  cardLarge: scale(24),
  input: scale(12),
  modal: scale(24),
  bottomSheet: scale(24),
  avatar: 9999,
  badge: scale(8),
  chip: scale(20),
  fab: 9999,
  tooltip: scale(8),
} as const;

// ==================== SHADOWS ====================

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: colors.common.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: colors.common.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: colors.common.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.common.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.common.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  '2xl': {
    shadowColor: colors.common.black,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 16,
  },

  // Component specific shadows
  card: {
    shadowColor: colors.common.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHover: {
    shadowColor: colors.common.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  button: {
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomSheet: {
    shadowColor: colors.common.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    shadowColor: colors.common.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  tabBar: {
    shadowColor: colors.common.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  fab: {
    shadowColor: colors.common.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdown: {
    shadowColor: colors.common.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

// ==================== Z-INDEX ====================

export const zIndex = {
  hide: -1,
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// ==================== ANIMATION ====================

export const animation = {
  // Durations (ms)
  duration: {
    instant: 0,
    fastest: 100,
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
    slowest: 700,
  },

  // Easing curves (for react-native-reanimated)
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    // Custom cubic beziers
    easeInQuad: [0.55, 0.085, 0.68, 0.53],
    easeOutQuad: [0.25, 0.46, 0.45, 0.94],
    easeInOutQuad: [0.455, 0.03, 0.515, 0.955],
    easeInCubic: [0.55, 0.055, 0.675, 0.19],
    easeOutCubic: [0.215, 0.61, 0.355, 1],
    easeInOutCubic: [0.645, 0.045, 0.355, 1],
    spring: [0.175, 0.885, 0.32, 1.275],
  },

  // Spring configs (for react-native-reanimated)
  spring: {
    gentle: { damping: 20, stiffness: 100 },
    default: { damping: 15, stiffness: 150 },
    bouncy: { damping: 10, stiffness: 180 },
    stiff: { damping: 20, stiffness: 300 },
    slow: { damping: 20, stiffness: 60 },
  },
} as const;

// ==================== COMPONENT SIZES ====================

export const componentSizes = {
  // Button heights
  button: {
    xs: verticalScale(32),
    sm: verticalScale(40),
    md: verticalScale(48),
    lg: verticalScale(56),
    xl: verticalScale(64),
  },

  // Input heights
  input: {
    sm: verticalScale(40),
    md: verticalScale(48),
    lg: verticalScale(56),
  },

  // Icon sizes
  icon: {
    xs: scale(16),
    sm: scale(20),
    md: scale(24),
    lg: scale(32),
    xl: scale(40),
    '2xl': scale(48),
  },

  // Avatar sizes
  avatar: {
    xs: scale(24),
    sm: scale(32),
    md: scale(40),
    lg: scale(56),
    xl: scale(72),
    '2xl': scale(96),
  },

  // Header height
  header: {
    default: verticalScale(56),
    large: verticalScale(96),
  },

  // Tab bar height
  tabBar: {
    default: verticalScale(60),
    withLabel: verticalScale(70),
  },

  // Bottom sheet
  bottomSheet: {
    handle: {
      width: scale(40),
      height: verticalScale(4),
    },
    minHeight: verticalScale(200),
    maxHeight: SCREEN_HEIGHT * 0.9,
  },

  // Card
  card: {
    minHeight: verticalScale(80),
    padding: scale(16),
  },

  // FAB (Floating Action Button)
  fab: {
    default: scale(56),
    mini: scale(40),
    extended: {
      height: verticalScale(48),
      minWidth: scale(80),
    },
  },

  // Touch targets (minimum recommended)
  touchTarget: {
    min: scale(44),
    recommended: scale(48),
  },
} as const;

// ==================== LAYOUT ====================

export const layout = {
  // Screen dimensions
  screen: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },

  // Container max widths
  container: {
    sm: scale(540),
    md: scale(720),
    lg: scale(960),
    xl: scale(1140),
    full: '100%',
  },

  // Safe area defaults
  safeArea: {
    top: Platform.OS === 'ios' ? 44 : 0,
    bottom: Platform.OS === 'ios' ? 34 : 0,
  },

  // Grid
  grid: {
    columns: 12,
    gutter: scale(16),
    margin: scale(16),
  },
} as const;

// ==================== BREAKPOINTS ====================

export const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  '2xl': 1400,
} as const;

// ==================== RTL SUPPORT ====================

export const rtl = {
  // Flip properties for RTL
  flipHorizontal: (isRTL: boolean) => ({
    transform: [{ scaleX: isRTL ? -1 : 1 }],
  }),

  // Text alignment
