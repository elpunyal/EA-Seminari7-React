export const LANGUAGE_NAMES: Record<string, string> = {
  es: 'Español',
  ca: 'Català',
  en: 'English',
};

export const languageName = (code?: string) =>
  code ? (LANGUAGE_NAMES[code] ?? code) : '—';

export const truncate = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max)}…` : text;

const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

export const formatPrice = (price?: number) =>
  price === undefined ? '—' : euros.format(price);