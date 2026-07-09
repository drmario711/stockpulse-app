import { differenceInHours } from 'date-fns';

// ─── Colors ──────────────────────────────────────────────────────────
export const colors = {
  bg: {
    primary: '#0A0E17',
    secondary: '#111827',
    card: '#1A1F2E',
    cardHover: '#242938',
  },
  accent: {
    primary: '#6366F1',
    secondary: '#818CF8',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
  },
  text: {
    primary: '#F9FAFB',
    secondary: '#9CA3AF',
    muted: '#6B7280',
    inverse: '#111827',
  },
  news: {
    fresh: '#00FF88',
    recent: '#FFB800',
    old: '#6B7280',
    breaking: '#FF3366',
  },
  sector: {
    energy: '#F59E0B',
    biotech: '#06B6D4',
    mining: '#10B981',
    tech: '#8B5CF6',
  },
  gradient: {
    primary: ['#6366F1', '#8B5CF6'] as string[],
    energy: ['#F59E0B', '#D97706'] as string[],
    biotech: ['#06B6D4', '#0891B2'] as string[],
    mining: ['#10B981', '#059669'] as string[],
    tech: ['#8B5CF6', '#7C3AED'] as string[],
  },
} as const;

// ─── Spacing ─────────────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ─── Border Radius ───────────────────────────────────────────────────
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// ─── Font Sizes ──────────────────────────────────────────────────────
export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// ─── Shadows (dark‑theme appropriate) ────────────────────────────────
export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cardLifted: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  glow: {
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Returns the theme color associated with a given sector string.
 */
export function getSectorColor(sector: string): string {
  const key = sector.toLowerCase() as keyof typeof colors.sector;
  return colors.sector[key] ?? colors.accent.primary;
}

/**
 * Returns the gradient pair associated with a given sector string.
 */
export function getSectorGradient(sector: string): string[] {
  const key = sector.toLowerCase() as keyof typeof colors.gradient;
  return (colors.gradient[key] as string[] | undefined) ?? colors.gradient.primary;
}

/**
 * Returns a color indicating how fresh a news item is based on its
 * `publishedAt` ISO timestamp:
 *   • green  (#00FF88) – less than 1 hour old
 *   • amber  (#FFB800) – less than 24 hours old
 *   • gray   (#6B7280) – older than 24 hours
 */
export function getNewsAgeColor(publishedAt: string): string {
  const hoursAgo = differenceInHours(new Date(), new Date(publishedAt));

  if (hoursAgo < 1) return colors.news.fresh;
  if (hoursAgo < 24) return colors.news.recent;
  return colors.news.old;
}
