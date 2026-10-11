import type { Book, CreateBook, UpdateBook } from '../models';
import { request } from './http';

interface BookListResponse {
  books: Book[];
}

interface BookResponse {
  book: Book;
}

export const bookService = {
  /** GET /books */
  getBooks: (signal?: AbortSignal) =>
    request<BookListResponse>('/books', { signal }).then((res) => res.books),

  /** GET /books/:id */
  getBook: (id: string, signal?: AbortSignal) =>
    request<BookResponse>(`/books/${id}`, { signal }).then((res) => res.book),

  /** POST /books */
  createBook: (payload: CreateBook) =>
    request<BookResponse>('/books', { method: 'POST', body: JSON.stringify(payload) }).then(
      (res) => res.book,
    ),

  /** PUT /books/:id */
  updateBook: (id: string, payload: UpdateBook) =>
    request<BookResponse>(`/books/${id}`, { method: 'PUT', body: JSON.stringify(payload) }).then(
      (res) => res.book,
    ),

  /** DELETE /books/:id */
  deleteBook: (id: string) => request<void>(`/books/${id}`, { method: 'DELETE' }),
};
