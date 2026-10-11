import type { Book, CreateBook, Page, PageQuery, UpdateBook } from '../models';
import { pageParams, request } from './http';

interface BookListResponse {
  books: Book[];
}

interface BookPageResponse extends BookListResponse {
  total: number;
  page: number;
  totalPages: number;
}

interface BookResponse {
  book: Book;
}

export const bookService = {
  /** GET /books */
  getBooks: (signal?: AbortSignal) =>
    request<BookListResponse>('/books', { signal }).then((res) => res.books),

  /** GET /books?page=1&limit=4&q=texto: solo una página. Busca y pagina la API */
  getBooksPage: (query: PageQuery, signal?: AbortSignal): Promise<Page<Book>> =>
    request<BookPageResponse>(`/books?${pageParams(query)}`, { signal }).then((res) => ({
      items: res.books,
      total: res.total,
      page: res.page,
      totalPages: res.totalPages,
    })),

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
