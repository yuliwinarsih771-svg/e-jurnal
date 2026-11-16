export const DEFAULT_APP_BG = '#f0f0f1';
export const DEFAULT_LOGIN_BG = '#f1f5f9';
export const DEFAULT_LOGIN_ACCENT = '#f26b6d';

export function normalizeHexColor(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

export function adjustHexBrightness(hex: string, amount: number): string {
  const valid = normalizeHexColor(hex, DEFAULT_LOGIN_ACCENT);
  const num = parseInt(valid.slice(1), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function isDarkColor(hex: string): boolean {
  const valid = normalizeHexColor(hex, DEFAULT_APP_BG);
  const num = parseInt(valid.slice(1), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

export function applyThemeCssVariables(theme: {
  warnaBgAplikasi?: string;
  warnaBgLogin?: string;
  warnaAksenLogin?: string;
}): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const appBg = normalizeHexColor(theme.warnaBgAplikasi, DEFAULT_APP_BG);
  const loginBg = normalizeHexColor(theme.warnaBgLogin, DEFAULT_LOGIN_BG);
  const loginAccent = normalizeHexColor(theme.warnaAksenLogin, DEFAULT_LOGIN_ACCENT);
  const loginAccentLight = adjustHexBrightness(loginAccent, 26);
  const loginAccentDark = adjustHexBrightness(loginAccent, -20);

  root.style.setProperty('--app-bg', appBg);
  root.style.setProperty('--login-bg', loginBg);
  root.style.setProperty('--login-accent', loginAccent);
  root.style.setProperty('--login-accent-light', loginAccentLight);
  root.style.setProperty('--login-accent-dark', loginAccentDark);
}
