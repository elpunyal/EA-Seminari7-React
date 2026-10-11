import { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { Link, useNavigate } from 'react-router-dom';

import { useToast } from '../context/ToastContext';
import { useApiList } from '../hooks/useApiList';
import { useListControls } from '../hooks/useListControls';
import type { Author } from '../models';
import { authorService } from '../services/author.service';
import { authorsView } from '../stores/viewMode';
import { errorMessage } from '../utils/api-error';
import { formatDate } from '../utils/format';
import { AuthorCard, RoleBadge } from './AuthorCard';
import { ConfirmModal } from './ConfirmModal';
import { Pagination } from './Pagination';
import { ViewToggle } from './ViewToggle';

// Autores que se ven en cada página de la tabla
const PAGE_SIZE = 4;

// Me quedo con los autores cuyo nombre o email contiene lo que se ha escrito.
// Está fuera del componente para que sea siempre la misma función (ver useListControls)
function matchesAuthor(author: Author, text: string) {
  return author.name.toLowerCase().includes(text) || author.email.toLowerCase().includes(text);
}

export function AuthorsList() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Estado global (Nanostores): tabla o tarjetas. Se guarda solo en el navegador
  const viewMode = useStore(authorsView);

  // Datos de la API (custom hook con useReducer dentro)
  const { items: authors, loading, error: loadError, removeItem } = useApiList(
    authorService.getAuthors,
  );
  // Búsqueda y página, guardadas en la URL
  const { search, setSearch, page, setPage, totalPages, pageItems } = useListControls(
    authors,
    matchesAuthor,
    PAGE_SIZE,
  );

  const [authorToDelete, setAuthorToDelete] = useState<Author | null>(null);
  const [actionError, setActionError] = useState('');
  const error = loadError || actionError;

  // useRef: acceso directo al <input> del DOM para poner el cursor en el buscador al entrar
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  function edit(author: Author) {
    // Además del :id en la URL, le paso el autor entero en el state de la navegación.
    // Así el formulario no tiene que volver a pedirlo a la API
    navigate(`/authors/${author._id}/edit`, { state: { author } });
  }

  async function confirmDelete() {
    if (!authorToDelete) {
      return;
    }
    setActionError('');
    try {
      await authorService.deleteAuthor(authorToDelete._id);
      removeItem(authorToDelete._id);
      showToast(`Autor "${authorToDelete.name}" borrado`);
    } catch (err) {
      setActionError(errorMessage(err));
    }
    setAuthorToDelete(null);
  }

  const emptyText = search ? `No hay resultados para "${search}"` : 'No hay autores';

  return (
    <>
      <div className="page-header">
        <h1>Autores</h1>
        <Link className="button" to="/authors/new">
          Nuevo autor
        </Link>
      </div>

      <div className="toolbar">
        {/* Input controlado: su valor viene del estado (la URL) y cada tecla lo cambia */}
        <input
          ref={searchRef}
          className="search"
          type="search"
          placeholder="Buscar por nombre o email"
          aria-label="Buscar autores"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ViewToggle mode={viewMode} onChange={(mode) => authorsView.set(mode)} />
      </div>

      {error && <p className="alert">{error}</p>}

      {loading && <p className="muted">Cargando...</p>}

      {!loading && (!error || authors.length > 0) && (
        <>
          {viewMode === 'list' ? (
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Nacionalidad</th>
                  <th>Nacimiento</th>
                  <th>Rol</th>
                  <th>Activo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {/* .map() convierte cada autor en una fila. La key ayuda a React a saber
                    qué fila es cuál cuando la lista cambia */}
                {pageItems.map((author) => (
                  <tr key={author._id} className={author.active ? '' : 'inactive'}>
                    <td>{author.name}</td>
                    <td>{author.email}</td>
                    <td>{author.nationality}</td>
                    <td>{formatDate(author.birthDate)}</td>
                    <td>
                      <RoleBadge role={author.role} />
                    </td>
                    <td>{author.active ? 'Sí' : 'No'}</td>
                    <td className="actions">
                      <button type="button" className="secondary" onClick={() => edit(author)}>
                        Editar
                      </button>
                      <button type="button" className="danger" onClick={() => setAuthorToDelete(author)}>
                        Borrar
                      </button>
                    </td>
                  </tr>
                ))}
                {pageItems.length === 0 && (
                  <tr>
                    <td className="empty" colSpan={7}>
                      {emptyText}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            // Los mismos autores de la página, pero en tarjetas
            <div className="cards">
              {pageItems.map((author) => (
                <AuthorCard
                  key={author._id}
                  author={author}
                  onEdit={edit}
                  onDelete={setAuthorToDelete}
                />
              ))}
              {pageItems.length === 0 && <p className="muted cards-empty">{emptyText}</p>}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

          <ConfirmModal
            open={authorToDelete !== null}
            title="Confirmar borrado"
            message={`¿Borrar a ${authorToDelete?.name}? Sus libros no se borran, pero dejarán de tenerlo como autor.`}
            confirmText="Borrar"
            onConfirm={confirmDelete}
            onCancel={() => setAuthorToDelete(null)}
          />
        </>
      )}
    </>
  );
}
