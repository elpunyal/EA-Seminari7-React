// En Angular esto eran pipes (languageName, truncate, date, currency, uppercase).
// En React no hace falta nada especial: son funciones normales que se llaman dentro del JSX.

const LANGUAGE_NAMES: Record<string, string> = {
  es: 'Castellano',
  ca: 'Catalán',
  en: 'Inglés',
};

// La API guarda el idioma como 'es', 'ca' o 'en' y en la pantalla quiero el nombre
export function languageName(code?: string): string {
  if (!code) {
    return '';
  }
  return LANGUAGE_NAMES[code] ?? code;
}

export function truncate(value: string | undefined | null, limit = 80, trail = '...'): string {
  if (!value) return '';
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean.length > limit ? clean.substring(0, limit).trim() + trail : clean;
}

// La API manda la fecha con hora en UTC ("1547-09-29T00:00:00.000Z"). Me quedo solo con el día
// y lo reordeno a mano: así la zona horaria no la mueve al día anterior (pasaba con Cervantes)
export function formatDate(iso?: string): string {
  if (!iso) {
    return '';
  }
  const [year, month, day] = iso.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

export function formatPrice(price?: number): string {
  return price === undefined || price === null ? '' : euro.format(price);
}

// Iniciales para el círculo de la tarjeta: primera y última palabra ("Miguel de Cervantes" -> "MC")
export function initials(name: string): string {
  const words = name.split(' ').filter((word) => word);
  const first = words[0] ?? '';
  const last = words.length > 1 ? words[words.length - 1] : '';
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}
