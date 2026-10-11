import { afterEach, describe, expect, it, vi } from 'vitest';

import { environment } from '../config/environment';
import { authorService } from './author.service';
import { ApiError } from './http';

function mockFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const fn = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe('authorService', () => {
  it('getAuthors() hace GET /authors y devuelve la lista', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      json: async () => ({ authors: [{ _id: 'a1', name: 'Ada', email: 'ada@example.com' }] }),
    });

    const authors = await authorService.getAuthors();

    expect(fetchMock.mock.calls[0][0]).toBe(`${environment.apiUrl}/authors`);
    expect(authors).toHaveLength(1);
    expect(authors[0].name).toBe('Ada');
  });

  it('createAuthor() envía un POST con el cuerpo en JSON', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 201,
      json: async () => ({ author: { _id: 'a2', name: 'Bea', email: 'bea@example.com' } }),
    });

    await authorService.createAuthor({ name: 'Bea', email: 'bea@example.com', password: '12345678' });

    const [, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body).name).toBe('Bea');
    expect(options.headers['Content-Type']).toBe('application/json');
  });

  it('deleteAuthor() no intenta leer el cuerpo de un 204', async () => {
    mockFetch({ ok: true, status: 204 });
    await expect(authorService.deleteAuthor('a1')).resolves.toBeUndefined();
  });

  it('lanza ApiError con el message de la API cuando responde con error', async () => {
    mockFetch({ ok: false, status: 409, json: async () => ({ message: 'email ya existe' }) });

    await expect(authorService.getAuthor('a1')).rejects.toMatchObject({
      message: 'email ya existe',
      status: 409,
    });
  });

  it('lanza ApiError con status 0 si no hay conexión con la API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const error = await authorService.getAuthors().catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
  });
});
