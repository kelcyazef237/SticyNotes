export const theme = {
  colors: {
    primary: '#FF9800', // Orange
    secondary: '#FFF8E1', // Cream
    tertiary: '#fff3e0', // Light orange
    brown: '#795548', // Brown
    darkBrown: '#5D4037', // Dark brown
    white: '#FFFFFF',
    black: '#212121',
    gray: '#9E9E9E',
    darkGray: '#616161', // Added for subtle contrast
    lightGray: '#E0E0E0',
    error: '#F44336',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    bold: '700' as const
  }
};
