import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authorService from '../services/author.service';
import { CanceledError } from '../services/api-client';
import type { Author } from '../models';
import AuthorCard from './AuthorCard';
import ConfirmModal from './ConfirmationModal';
import Pagination from './Pagination';
import ViewToggle, { savedViewMode, type ViewMode } from './ViewToggle';


const PAGE_SIZE = 4;


const formatDate = (iso?: string) => {
  if (!iso) return '—';
  const [year, month, day] = iso.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
};

export default function AuthorsList() {
  const navigate = useNavigate();

  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>(() => savedViewMode('authors-view'));
  const [authorToDelete, setAuthorToDelete] = useState<Author | null>(null);


  useEffect(() => {
    const { request, cancel } = authorService.getAll<{ authors: Author[] }>();

    request
      .then((res) => {
        setAuthors(res.data.authors);
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
    localStorage.setItem('authors-view', viewMode);
  }, [viewMode]);


  const filteredAuthors = useMemo(() => {
    const text = search.trim().toLowerCase();
    return authors.filter(
      (a) => a.name.toLowerCase().includes(text) || a.email.toLowerCase().includes(text),
    );
  }, [authors, search]);


  const totalPages = Math.max(1, Math.ceil(filteredAuthors.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageAuthors = filteredAuthors.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const deleteMessage = authorToDelete
    ? `¿Borrar a ${authorToDelete.name}? Sus libros no se borran, pero dejarán de tenerlo como autor.`
    : '';

  const edit = (author: Author) => {
    navigate(`/authors/${author._id}/edit`, { state: { author } });
  };

  const confirmDelete = () => {
    if (!authorToDelete) return;

    setError('');
    authorService
      .delete(authorToDelete._id)
      .then(() => {
        setAuthors((list) => list.filter((a) => a._id !== authorToDelete._id));
      })
      .catch((err) => setError(err.response?.data?.message ?? err.message))
      .finally(() => setAuthorToDelete(null)); 
  };

  return (
    <div>
      <div className="page-header">
        <h1>Autores</h1>
        <button onClick={() => navigate('/authors/new')}>Nuevo autor</button>
      </div>

      <div className="toolbar">
        <input
          className="search-input"
          type="search"
          placeholder="Buscar por nombre o email"
          aria-label="Buscar autores"
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
                {pageAuthors.map((author) => (
                  <tr key={author._id} className={!author.active ? 'inactive' : ''}>
                    <td>{author.name}</td>
                    <td>{author.email}</td>
                    <td>{author.nationality}</td>
                    <td>{formatDate(author.birthDate)}</td>
                    <td>
                      <span
                        className="role-badge"
                        style={{ backgroundColor: author.role === 'admin' ? '#fde2e1' : '#e3e8fb' }}
                      >
                        {author.role?.toUpperCase()}
                      </span>
                    </td>
                    <td>{author.active ? 'Sí' : 'No'}</td>
                    <td>
                      <button onClick={() => edit(author)}>Editar</button>
                      <button onClick={() => setAuthorToDelete(author)}>Borrar</button>
                    </td>
                  </tr>
                ))}
                {pageAuthors.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      {search ? `No hay resultados para "${search}"` : 'No hay autores'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <div className="cards-bo">
              {pageAuthors.map((author) => (
                <AuthorCard
                  key={author._id}
                  author={author}
                  onEdit={edit}
                  onDelete={setAuthorToDelete}
                />
              ))}
              {pageAuthors.length === 0 && (
                <p className="muted">
                  {search ? `No hay resultados para "${search}"` : 'No hay autores'}
                </p>
              )}
            </div>
          )}

          <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />

          <ConfirmModal
            open={authorToDelete !== null}
            title="Confirmar borrado"
            message={deleteMessage}
            confirmText="Borrar"
            onConfirm={confirmDelete}
            onCancel={() => setAuthorToDelete(null)}
          />
        </>
      )}
    </div>
  );
}