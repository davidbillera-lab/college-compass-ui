// CampusClimb Email Design System - Bold & Colorful Theme
// Matches the app's sage green + warm amber design

export const colors = {
  // Primary - Sage Green
  primary: '#4a8a6e',
  primaryDark: '#3d7259',
  primaryLight: '#e8f4ed',
  
  // Accent - Warm Amber
  accent: '#f59e0b',
  accentDark: '#d97706',
  accentLight: '#fef3c7',
  
  // Backgrounds
  background: '#faf9f7',
  white: '#ffffff',
  
  // Text
  foreground: '#1e293b',
  muted: '#64748b',
  mutedLight: '#94a3b8',
  
  // Borders
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  
  // Status
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
};

export const fonts = {
  primary: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  mono: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace",
};

export const styles = {
  // Container
  body: {
    backgroundColor: colors.background,
    fontFamily: fonts.primary,
    margin: '0',
    padding: '0',
  },
  
  container: {
    backgroundColor: colors.white,
    borderRadius: '16px',
    border: `1px solid ${colors.border}`,
    margin: '40px auto',
    maxWidth: '560px',
    padding: '0',
    overflow: 'hidden' as const,
  },
  
  // Header with gradient
  header: {
    background: `linear-gradient(135deg, ${colors.primary} 0%, #4a9a7a 100%)`,
    padding: '32px 40px',
    textAlign: 'center' as const,
  },
  
  logoText: {
    color: colors.white,
    fontSize: '28px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    margin: '0',
  },
  
  logoAccent: {
    color: colors.accent,
  },
  
  tagline: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: '14px',
    fontWeight: '500',
    margin: '8px 0 0 0',
  },
  
  // Content
  content: {
    padding: '40px',
  },
  
  heading: {
    color: colors.foreground,
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '-0.3px',
    lineHeight: '1.3',
    margin: '0 0 16px 0',
  },
  
  text: {
    color: colors.muted,
    fontSize: '16px',
    fontWeight: '400',
    lineHeight: '1.6',
    margin: '0 0 24px 0',
  },
  
  textSmall: {
    color: colors.mutedLight,
    fontSize: '14px',
    fontWeight: '400',
    lineHeight: '1.5',
    margin: '0',
  },
  
  // Primary CTA Button
  button: {
    backgroundColor: colors.accent,
    borderRadius: '12px',
    color: '#1a1a1a',
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: '700',
    padding: '16px 32px',
    textAlign: 'center' as const,
    textDecoration: 'none',
  },
  
  buttonContainer: {
    margin: '32px 0',
    textAlign: 'center' as const,
  },
  
  // Secondary/Link button
  link: {
    color: colors.primary,
    fontWeight: '600',
    textDecoration: 'underline',
  },
  
  // Code/Token display
  code: {
    backgroundColor: colors.primaryLight,
    border: `2px dashed ${colors.primary}`,
    borderRadius: '12px',
    color: colors.primary,
    display: 'block',
    fontFamily: fonts.mono,
    fontSize: '32px',
    fontWeight: '700',
    letterSpacing: '4px',
    margin: '24px 0',
    padding: '20px',
    textAlign: 'center' as const,
  },
  
  // Divider
  divider: {
    borderTop: `1px solid ${colors.borderLight}`,
    margin: '32px 0',
  },
  
  // Footer
  footer: {
    backgroundColor: colors.background,
    borderTop: `1px solid ${colors.border}`,
    padding: '24px 40px',
    textAlign: 'center' as const,
  },
  
  footerText: {
    color: colors.mutedLight,
    fontSize: '13px',
    lineHeight: '1.5',
    margin: '0 0 8px 0',
  },
  
  footerLink: {
    color: colors.muted,
    fontSize: '13px',
    textDecoration: 'none',
  },
  
  // Callout box
  callout: {
    backgroundColor: colors.accentLight,
    borderLeft: `4px solid ${colors.accent}`,
    borderRadius: '0 8px 8px 0',
    margin: '24px 0',
    padding: '16px 20px',
  },
  
  calloutText: {
    color: colors.foreground,
    fontSize: '14px',
    fontWeight: '500',
    lineHeight: '1.5',
    margin: '0',
  },
  
  // Info box
  infoBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: '12px',
    margin: '24px 0',
    padding: '20px',
  },
  
  infoBoxText: {
    color: colors.foreground,
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '0',
  },
};
