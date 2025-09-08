// Design System Tokens - Single source of truth for design values

export const colors = {
  brandGreen: '#D1F472',
  brandOrange: '#C13D1A',
  ink: '#111827',
  muted: '#6B7280',
  surface: '#FFFFFF',
  bg: '#F7F8FA',
} as const;

export const borderRadius = {
  md: '16px',
  xl: '22px',
  '3xl': '28px',
} as const;

export const boxShadow = {
  card: '0 8px 30px rgba(0,0,0,0.06)',
  cardHover: '0 8px 30px rgba(0,0,0,0.08)',
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
} as const;

export const typography = {
  fontFamily: {
    sans: ['Noto Sans TC', 'sans-serif'],
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export type ColorToken = keyof typeof colors;
export type BorderRadiusToken = keyof typeof borderRadius;
export type BoxShadowToken = keyof typeof boxShadow;
export type SpacingToken = keyof typeof spacing;
