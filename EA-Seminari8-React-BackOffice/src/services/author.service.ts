import type { Author, CreateAuthor, UpdateAuthor } from '../models';
import { request } from './http';

interface AuthorListResponse {
  authors: Author[];
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
