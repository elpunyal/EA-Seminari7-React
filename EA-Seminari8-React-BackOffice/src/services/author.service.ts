import type { Author, CreateAuthor, Page, PageQuery, UpdateAuthor } from '../models';
import { pageParams, request } from './http';

interface AuthorListResponse {
  authors: Author[];
}

// Cuando se pide paginado, la API añade el total y las páginas que hay
interface AuthorPageResponse extends AuthorListResponse {
  total: number;
  page: number;
  totalPages: number;
}

interface AuthorResponse {
  author: Author;
}

// Service layer: aquí viven las llamadas a la API. Los componentes nunca usan fetch directamente.
// Los métodos que leen reciben un AbortSignal opcional para poder cancelar la petición.
export const authorService = {
  /** GET /authors */
  getAuthors: (signal?: AbortSignal) =>
    request<AuthorListResponse>('/authors', { signal }).then((res) => res.authors),

  /** GET /authors?page=1&limit=4&q=texto: solo una página. Busca y pagina la API */
  getAuthorsPage: (query: PageQuery, signal?: AbortSignal): Promise<Page<Author>> =>
    request<AuthorPageResponse>(`/authors?${pageParams(query)}`, { signal }).then((res) => ({
      items: res.authors,
      total: res.total,
      page: res.page,
      totalPages: res.totalPages,
    })),

  /** GET /authors/:id */
  getAuthor: (id: string, signal?: AbortSignal) =>
    request<AuthorResponse>(`/authors/${id}`, { signal }).then((res) => res.author),

  /** POST /authors */
  createAuthor: (payload: CreateAuthor) =>
    request<AuthorResponse>('/authors', { method: 'POST', body: JSON.stringify(payload) }).then(
      (res) => res.author,
    ),

  /** PUT /authors/:id */
  updateAuthor: (id: string, payload: UpdateAuthor) =>
    request<AuthorResponse>(`/authors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }).then((res) => res.author),

  /** DELETE /authors/:id */
  deleteAuthor: (id: string) => request<void>(`/authors/${id}`, { method: 'DELETE' }),
};
