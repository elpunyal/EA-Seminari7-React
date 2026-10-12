import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import bookService from '../services/book.service';
import { CanceledError } from '../services/api-client';
import type { Book } from '../models';
import { formatPrice, languageName, truncate } from '../utils/format';
import ConfirmModal from './ConfirmationModal';
import Pagination from './Pagination';
import ViewToggle, { savedViewMode, type ViewMode } from './ViewToggle';

// Libros por página (la tabla y las cards comparten paginación)
const PAGE_SIZE = 4;

export default function BookList() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>(() => savedViewMode('books-view'));
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { request, cancel } = bookService.getAll<{ books: Book[] }>();

    request
      .then((res) => {
        setBooks(res.data.books);
        setLoading(false);
      })
      .catch((err) => {
        if (err instanceof CanceledError) return;
        setError(err.response?.data?.message ?? err.message);
        setLoading(false);
      });

    return () => cancel();
  }, []);

  useEffect(() => {
    localStorage.setItem('books-view', viewMode);
  }, [viewMode]);

  // Buscador: título, ISBN, descripción y editorial
  const filteredBooks = useMemo(() => {
    const text = search.trim().toLowerCase();
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(text) ||
        b.isbn.toLowerCase().includes(text) ||
        (b.description ?? '').toLowerCase().includes(text) ||
        (b.publisher ?? '').toLowerCase().includes(text),
    );
  }, [books, search]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageBooks = filteredBooks.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const deleteMessage = bookToDelete ? `¿Borrar el libro "${bookToDelete.title}"?` : '';

  const confirmDelete = () => {
    if (!bookToDelete) return;

    setError('');
    bookService
      .delete(bookToDelete._id)
      .then(() => {
        setBooks((list) => list.filter((b) => b._id !== bookToDelete._id));
      })
      .catch((err) => setError(err.response?.data?.message ?? err.message))
      .finally(() => setBookToDelete(null));
  };

  const authorNames = (book: Book) =>
    book.authors.length > 0 ? book.authors.map((a) => a.name).join(', ') : 'Sin autores';

  const emptyMessage = search ? `No hay resultados para "${search}"` : 'No hay libros';

  return (
    <div>
      <div className="page-header">
        <h1>Libros</h1>
        <button onClick={() => navigate('/books/new')}>Nuevo libro</button>
      </div>

      <div className="toolbar">
        <input
          className="search-input"
          type="search"
          placeholder="Buscar por título, ISBN, descripción o editorial"
          aria-label="Buscar libros"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <ViewToggle mode={viewMode} onModeChange={setViewMode} />
      </div>

      {error && <p className="alert-bo">{error}</p>}
      {loading && <p className="muted">Cargando...</p>}

      {!loading && (
        <>
          {viewMode === 'list' ? (
            <table className="table-bo">
              <thead>
                <tr>
                  <th></th>
                  <th>Título</th>
                  <th>Descripción</th>
                  <th>Editorial</th>
                  <th>Autores</th>
                  <th>Idioma</th>
                  <th>Año</th>
                  <th>Precio</th>
                  <th>Tags</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pageBooks.map((book) => (
                  <tr key={book._id}>
                    <td>
                      <img
                        className="book-cover"
                        src={`https://picsum.photos/seed/${book._id}/60/80`}
                        alt={`Portada de ${book.title}`}
                      />
                    </td>
                    <td>{book.title}</td>
                    <td title={book.description ?? ''}>
                      {book.description ? (
                        truncate(book.description, 70)
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>{book.publisher || '—'}</td>
                    <td>{authorNames(book)}</td>
                    <td>{languageName(book.language)}</td>
                    <td>{book.publishedYear ?? '—'}</td>
                    <td>{formatPrice(book.price)}</td>
                    <td>
                      {book.tags?.map((tag) => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </td>
                    <td>
                      <button onClick={() => navigate(`/books/${book._id}/edit`)}>Editar</button>
                      <button onClick={() => setBookToDelete(book)}>Borrar</button>
                    </td>
                  </tr>
                ))}
                {pageBooks.length === 0 && (
                  <tr>
                    <td colSpan={10}>{emptyMessage}</td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <div className="cards-bo">
              {pageBooks.map((book) => (
                <article key={book._id} className="book-card">
                  {/* Misma imagen que en la tabla (misma seed), pero más grande */}
                  <img
                    className="card-cover"
                    src={`https://picsum.photos/seed/${book._id}/400/240`}
                    alt={`Portada de ${book.title}`}
                  />
                  <div className="card-body-bo">
                    <h3>{book.title}</h3>
                    {book.publisher && <span className="muted">{book.publisher}</span>}
                    <span className="muted">{authorNames(book)}</span>
                    {book.description && (
                      <p className="card-text" title={book.description}>
                        {truncate(book.description, 90)}
                      </p>
                    )}
                    <span>
                      {languageName(book.language)}
                      {book.publishedYear && ` · ${book.publishedYear}`}
                    </span>
                    <strong>{formatPrice(book.price)}</strong>
                    <div>
                      {book.tags?.map((tag) => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="card-actions-bo">
                    <button onClick={() => navigate(`/books/${book._id}/edit`)}>Editar</button>
                    <button onClick={() => setBookToDelete(book)}>Borrar</button>
                  </div>
                </article>
              ))}
              {pageBooks.length === 0 && <p className="muted">{emptyMessage}</p>}
            </div>
          )}

          <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />

          <ConfirmModal
            open={bookToDelete !== null}
            title="Confirmar borrado"
            message={deleteMessage}
            confirmText="Borrar"
            onConfirm={confirmDelete}
            onCancel={() => setBookToDelete(null)}
          />
        </>
      )}
    </div>
  );
}