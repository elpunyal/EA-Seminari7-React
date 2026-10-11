import { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { Link } from 'react-router-dom';

import { useToast } from '../context/ToastContext';
import { useApiList } from '../hooks/useApiList';
import { useListControls } from '../hooks/useListControls';
import type { Book } from '../models';
import { bookService } from '../services/book.service';
import { booksView } from '../stores/viewMode';
import { errorMessage } from '../utils/api-error';
import { formatPrice, languageName, truncate } from '../utils/format';
import { ConfirmModal } from './ConfirmModal';
import { Pagination } from './Pagination';
import { ViewToggle } from './ViewToggle';

// Libros que se ven en cada página de la tabla
const PAGE_SIZE = 4;

// Me quedo con los libros cuyo título, ISBN o descripción contiene lo que se ha escrito
function matchesBook(book: Book, text: string) {
  return (
    book.title.toLowerCase().includes(text) ||
    book.isbn.toLowerCase().includes(text) ||
    (book.description?.toLowerCase().includes(text) ?? false)
  );
}

// Lista de autores de un libro. Si se borra el único autor, la API lo devuelve sin autores
function authorNames(book: Book) {
  return book.authors.length > 0 ? book.authors.map((author) => author.name).join(', ') : null;
}

export function BooksList() {
  const { showToast } = useToast();
  const viewMode = useStore(booksView);

  const { items: books, loading, error: loadError, removeItem } = useApiList(bookService.getBooks);
  const { search, setSearch, page, setPage, totalPages, pageItems } = useListControls(
    books,
    matchesBook,
    PAGE_SIZE,
  );

  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [actionError, setActionError] = useState('');
  const error = loadError || actionError;

  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  async function confirmDelete() {
    if (!bookToDelete) {
      return;
    }
    setActionError('');
    try {
      await bookService.deleteBook(bookToDelete._id);
      removeItem(bookToDelete._id);
      showToast(`Libro "${bookToDelete.title}" borrado`);
    } catch (err) {
      setActionError(errorMessage(err));
    }
    setBookToDelete(null);
  }

  const emptyText = search ? `No hay resultados para "${search}"` : 'No hay libros';

  return (
    <>
      <div className="page-header">
        <h1>Libros</h1>
        <Link className="button" to="/books/new">
          Nuevo libro
        </Link>
      </div>

      <div className="toolbar">
        <input
          ref={searchRef}
          className="search"
          type="search"
          placeholder="Buscar por título, ISBN o descripción"
          aria-label="Buscar libros"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ViewToggle mode={viewMode} onChange={(mode) => booksView.set(mode)} />
      </div>

      {error && <p className="alert">{error}</p>}

      {loading && <p className="muted">Cargando...</p>}

      {!loading && (!error || books.length > 0) && (
        <>
          {viewMode === 'list' ? (
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Título</th>
                  <th>Descripción</th>
                  <th>Autores</th>
                  <th>Idioma</th>
                  <th>Año</th>
                  <th>Precio</th>
                  <th>Tags</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((book) => (
                  <tr key={book._id}>
                    <td>
                      <img
                        className="cover"
                        src={`https://picsum.photos/seed/${book._id}/60/80`}
                        alt={`Portada de ${book.title}`}
                      />
                    </td>
                    <td>{book.title}</td>
                    <td title={book.description ?? ''}>
                      {book.description ? truncate(book.description, 70) : <span className="muted">—</span>}
                    </td>
                    <td>{authorNames(book) ?? <span className="muted">Sin autores</span>}</td>
                    <td>{languageName(book.language)}</td>
                    <td>{book.publishedYear}</td>
                    <td>{formatPrice(book.price)}</td>
                    <td>
                      {book.tags?.map((tag) => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </td>
                    <td className="actions">
                      {/* Aquí el id solo va en la URL; el formulario pide el libro a la API */}
                      <Link className="button secondary" to={`/books/${book._id}/edit`}>
                        Editar
                      </Link>
                      <button type="button" className="danger" onClick={() => setBookToDelete(book)}>
                        Borrar
                      </button>
                    </td>
                  </tr>
                ))}
                {pageItems.length === 0 && (
                  <tr>
                    <td className="empty" colSpan={9}>
                      {emptyText}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            // Los mismos libros de la página, pero en tarjetas con la portada grande
            <div className="cards">
              {pageItems.map((book) => (
                <article key={book._id} className="card">
                  <img
                    className="card-cover"
                    src={`https://picsum.photos/seed/${book._id}/400/240`}
                    alt={`Portada de ${book.title}`}
                  />
                  <div className="card-body">
                    <h3>{book.title}</h3>
                    <span className="muted">{authorNames(book) ?? 'Sin autores'}</span>
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
                  <div className="card-actions">
                    <Link className="button secondary" to={`/books/${book._id}/edit`}>
                      Editar
                    </Link>
                    <button type="button" className="danger" onClick={() => setBookToDelete(book)}>
                      Borrar
                    </button>
                  </div>
                </article>
              ))}
              {pageItems.length === 0 && <p className="muted cards-empty">{emptyText}</p>}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

          <ConfirmModal
            open={bookToDelete !== null}
            title="Confirmar borrado"
            message={`¿Borrar el libro "${bookToDelete?.title}"?`}
            confirmText="Borrar"
            onConfirm={confirmDelete}
            onCancel={() => setBookToDelete(null)}
          />
        </>
      )}
    </>
  );
}
