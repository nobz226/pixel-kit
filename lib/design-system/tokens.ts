export const colors = {
  background: {
    primary: '#0a0a0b',
    secondary: '#111113',
    tertiary: '#18181b',
    elevated: '#1f1f23',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
  surface: {
    primary: 'rgba(255, 255, 255, 0.03)',
    secondary: 'rgba(255, 255, 255, 0.05)',
    tertiary: 'rgba(255, 255, 255, 0.08)',
    hover: 'rgba(255, 255, 255, 0.1)',
    active: 'rgba(255, 255, 255, 0.15)',
  },
  border: {
    primary: 'rgba(255, 255, 255, 0.06)',
    secondary: 'rgba(255, 255, 255, 0.1)',
    tertiary: 'rgba(255, 255, 255, 0.15)',
    focus: '#00d4aa',
  },
  text: {
    primary: '#fafafa',
    secondary: '#a1a1aa',
    tertiary: '#71717a',
    inverse: '#0a0a0b',
    muted: '#52525b',
  },
  accent: {
    primary: '#00d4aa',
    primaryHover: '#00e8bb',
    primaryLight: 'rgba(0, 212, 170, 0.15)',
    secondary: '#6366f1',
    secondaryHover: '#818cf8',
    warning: '#f59e0b',
    error: '#ef4444',
    success: '#22c55e',
  },
  canvas: {
    checkerboardLight: '#2a2a2c',
    checkerboardDark: '#1e1e20',
    background: '#0d0d0e',
  },
  tool: {
    active: 'rgba(0, 212, 170, 0.2)',
    activeBorder: 'rgba(0, 212, 170, 0.4)',
    hover: 'rgba(255, 255, 255, 0.08)',
  },
};

export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  32: '8rem',
};

export const typography = {
  fontFamily: {
    sans: 'var(--font-geist-sans), system-ui, sans-serif',
    mono: 'var(--font-geist-mono), monospace',
    display: 'var(--font-geist-sans), system-ui, sans-serif',
  },
  fontSize: {
    xs: ['0.7rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
    sm: ['0.8125rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],
    base: ['0.9375rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
    lg: ['1.0625rem', { lineHeight: '1.625rem', letterSpacing: '-0.01em' }],
    xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.015em' }],
    '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.025em' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.03em' }],
    '5xl': ['3rem', { lineHeight: '3.5rem', letterSpacing: '-0.035em' }],
    '6xl': ['3.75rem', { lineHeight: '4rem', letterSpacing: '-0.04em' }],
    '7xl': ['4.5rem', { lineHeight: '4.5rem', letterSpacing: '-0.045em' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.1',
    snug: '1.25',
    normal: '1.5',
    relaxed: '1.625',
  },
};

export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  sm: '0 2px 4px -1px rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.2)',
  md: '0 4px 8px -2px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
  lg: '0 10px 20px -5px rgba(0, 0, 0, 0.4), 0 4px 8px -4px rgba(0, 0, 0, 0.2)',
  xl: '0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 8px 16px -8px rgba(0, 0, 0, 0.2)',
  '2xl': '0 30px 60px -15px rgba(0, 0, 0, 0.6), 0 12px 24px -12px rgba(0, 0, 0, 0.3)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
  glow: '0 0 20px rgba(0, 212, 170, 0.3), 0 0 40px rgba(0, 212, 170, 0.1)',
  glowSubtle: '0 0 10px rgba(0, 212, 170, 0.15)',
  panel: '0 4px 24px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3)',
  panelHover: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.4)',
};

export const borderRadius = {
  none: '0',
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  full: '9999px',
};

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  slower: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  spring: '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  springGentle: '600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
};

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
  max: 9999,
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const canvasSizes = {
  toolbarWidth: '72px',
  sidebarWidth: '320px',
  headerHeight: '56px',
  footerHeight: '48px',
};

export const animationPresets = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
  },
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
  },
  slideInLeft: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  slideInRight: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 30 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  staggerContainer: {
    animate: { transition: { staggerChildren: 0.08 } },
  },
  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
  pageTransition: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
  microInteraction: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { type: 'spring', stiffness: 400, damping: 17 },
  },
  buttonPress: {
    whileTap: { scale: 0.96 },
    transition: { type: 'spring', stiffness: 400, damping: 17 },
  },
  panelExpand: {
    initial: { height: 0, opacity: 0 },
    animate: { height: 'auto', opacity: 1 },
    exit: { height: 0, opacity: 0 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
};

export const glassmorphism = {
  light: {
    background: 'rgba(255, 255, 255, 0.04)',
    backdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
  },
  medium: {
    background: 'rgba(255, 255, 255, 0.06)',
    backdropFilter: 'blur(30px) saturate(200%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
  },
  heavy: {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(40px) saturate(200%)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6), 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  },
  accent: {
    background: 'rgba(0, 212, 170, 0.05)',
    backdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(0, 212, 170, 0.2)',
    boxShadow: '0 4px 24px rgba(0, 212, 170, 0.1), 0 1px 3px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(0, 212, 170, 0.1)',
  },
};

export const gradients = {
  primary: 'linear-gradient(135deg, #00d4aa 0%, #00a8e8 100%)',
  primarySubtle: 'linear-gradient(135deg, rgba(0, 212, 170, 0.15) 0%, rgba(0, 168, 232, 0.1) 100%)',
  secondary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  surface: 'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
  surfaceHover: 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
  radial: 'radial-gradient(ellipse at center, rgba(0, 212, 170, 0.15) 0%, transparent 70%)',
  radialSecondary: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
  noise: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
  mesh: 'linear-gradient(135deg, rgba(0, 212, 170, 0.08) 0%, transparent 50%), linear-gradient(225deg, rgba(99, 102, 241, 0.08) 0%, transparent 50%)',
};

export const canvasCheckerboard = {
  size: 24,
  light: '#2a2a2c',
  dark: '#1e1e20',
};

export type ColorTokens = typeof colors;
export type SpacingTokens = typeof spacing;
export type TypographyTokens = typeof typography;
export type ShadowTokens = typeof shadows;
export type BorderRadiusTokens = typeof borderRadius;
export type TransitionTokens = typeof transitions;
export type ZIndexTokens = typeof zIndex;
export type AnimationPresets = typeof animationPresets;
export type GlassmorphismTokens = typeof glassmorphism;
export type GradientTokens = typeof gradients;