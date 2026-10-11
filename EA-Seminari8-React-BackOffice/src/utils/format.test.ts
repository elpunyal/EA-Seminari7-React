import { describe, expect, it } from 'vitest';

import { formatDate, initials, languageName, truncate } from './format';
import { removeEmpty } from './remove-empty';

describe('format', () => {
  it('languageName() convierte el código en el nombre', () => {
    expect(languageName('es')).toBe('Castellano');
    expect(languageName('ca')).toBe('Catalán');
    expect(languageName('fr')).toBe('fr');
    expect(languageName(undefined)).toBe('');
  });

  it('truncate() corta los textos largos', () => {
    expect(truncate('hola', 10)).toBe('hola');
    expect(truncate('uno dos tres cuatro', 7)).toBe('uno dos...');
    expect(truncate(undefined)).toBe('');
  });

  it('formatDate() no mueve el día por la zona horaria', () => {
    expect(formatDate('1547-09-29T00:00:00.000Z')).toBe('29/09/1547');
    expect(formatDate(undefined)).toBe('');
  });

  it('initials() usa la primera y la última palabra', () => {
    expect(initials('Miguel de Cervantes')).toBe('MC');
    expect(initials('Borges')).toBe('B');
  });
});

describe('removeEmpty', () => {
  it('quita los campos vacíos, null y undefined, pero deja false, 0 y las listas vacías', () => {
    expect(
      removeEmpty({ a: '', b: '  ', c: null, d: undefined, e: 'ok', f: false, g: 0, h: [] }),
    ).toEqual({ e: 'ok', f: false, g: 0, h: [] });
  });
});
