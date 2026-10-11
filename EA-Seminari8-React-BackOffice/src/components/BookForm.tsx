import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useToast } from '../context/ToastContext';
import { useApiList } from '../hooks/useApiList';
import { useForm } from '../hooks/useForm';
import { BOOK_LANGUAGES, BOOK_TAGS } from '../models';
import type { Book, BookLanguage, CreateBook } from '../models';
import { authorService } from '../services/author.service';
import { bookService } from '../services/book.service';
import { errorMessage, isAbort } from '../utils/api-error';
import { languageName } from '../utils/format';
import { removeEmpty } from '../utils/remove-empty';
import { Field } from './Field';

// En un formulario controlado todos los valores se guardan como texto (así los devuelve un input).
// Los números se convierten al enviar.
type BookFormValues = {
  title: string;
  isbn: string;
  authors: string[];
  description: string;
  publishedYear: string;
  pages: string;
  language: BookLanguage;
  tags: string[];
  price: string;
};

const INITIAL_VALUES: BookFormValues = {
  title: '',
  isbn: '',
  authors: [],
  description: '',
  publishedYear: '',
  pages: '',
  language: 'es',
  tags: [],
  price: '',
};

function validate(values: BookFormValues) {
  const errors: Partial<Record<keyof BookFormValues, string>> = {};

  if (!values.title.trim()) errors.title = 'El título es obligatorio';
  if (!values.isbn.trim()) errors.isbn = 'El ISBN es obligatorio';
  if (values.authors.length === 0) errors.authors = 'Elige al menos un autor';

  if (values.publishedYear !== '') {
    const year = Number(values.publishedYear);
    if (year < 1450 || year > 2100) errors.publishedYear = 'Tiene que estar entre 1450 y 2100';
  }
  if (values.pages !== '' && Number(values.pages) < 1) {
    errors.pages = 'Tiene que tener 1 página como mínimo';
  }
  if (values.price !== '' && Number(values.price) < 0) {
    errors.price = 'No puede ser negativo';
  }

  return errors;
}

export function BookForm() {
  // Igual que en el formulario de autores: en /books/:id/edit llega el id, en /books/new no
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const form = useForm<BookFormValues>(INITIAL_VALUES, validate);
  const { fill } = form;

  // Opciones del select de autores: el mismo hook que usa la lista de autores
  const { items: authors, error: authorsError } = useApiList(authorService.getAuthors);

  // Si estoy editando, empiezo en "cargando" hasta que llegue el libro
  const [loading, setLoading] = useState(Boolean(id));
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    titleRef.current?.focus();
  }, [loading]);

  useEffect(() => {
    if (!id) {
      return;
    }

    const controller = new AbortController();
    bookService
      .getBook(id, controller.signal)
      .then((book: Book) => {
        fill({
          title: book.title,
          isbn: book.isbn,
          // La API manda los autores enteros (populate), pero el select trabaja con sus ids
          authors: book.authors.map((author) => author._id),
          description: book.description ?? '',
          publishedYear: book.publishedYear?.toString() ?? '',
          pages: book.pages?.toString() ?? '',
          language: book.language ?? 'es',
          tags: book.tags ?? [],
          price: book.price?.toString() ?? '',
        });
        setLoading(false);
      })
      .catch((err) => {
        if (isAbort(err)) {
          return;
        }
        setError(errorMessage(err));
        setLoadFailed(true);
        setLoading(false);
      });
    return () => controller.abort();
  }, [id, fill]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    form.touchAll();
    if (!form.isValid) {
      return;
    }

    const { values } = form;
    // Convierto los números y quito los campos vacíos (Joi responde 422 si le llega un "")
    const book = removeEmpty({
      ...values,
      publishedYear: values.publishedYear === '' ? undefined : Number(values.publishedYear),
      pages: values.pages === '' ? undefined : Number(values.pages),
      price: values.price === '' ? undefined : Number(values.price),
    }) as CreateBook;

    setSaving(true);
    setError('');
    try {
      if (id) {
        await bookService.updateBook(id, book);
      } else {
        await bookService.createBook(book);
      }
      showToast(id ? 'Libro actualizado' : 'Libro creado');
      navigate('/books', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  const shownError = error || authorsError;

  return (
    <div className="form-page">
      <h1>{id ? 'Editar libro' : 'Nuevo libro'}</h1>

      {shownError && <p className="alert">{shownError}</p>}

      {loading ? (
        <p className="muted">Cargando...</p>
      ) : loadFailed ? (
        <Link to="/books">Volver a la lista de libros</Link>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <Field label="Título *" error={form.errorOf('title')}>
            <input
              ref={titleRef}
              type="text"
              name="title"
              value={form.values.title}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              className={form.errorOf('title') ? 'invalid' : ''}
            />
          </Field>

          <Field label="ISBN *" error={form.errorOf('isbn')}>
            <input
              type="text"
              name="isbn"
              value={form.values.isbn}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              className={form.errorOf('isbn') ? 'invalid' : ''}
            />
          </Field>

          <Field label="Autores *" error={form.errorOf('authors')} hint="Ctrl + clic para elegir varios">
            <select
              multiple
              name="authors"
              value={form.values.authors}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              className={form.errorOf('authors') ? 'invalid' : ''}
            >
              {authors.map((author) => (
                <option key={author._id} value={author._id}>
                  {author.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Descripción">
            <textarea
              name="description"
              rows={4}
              placeholder="Escribe una breve sinopsis o descripción del libro..."
              value={form.values.description}
              onChange={form.handleChange}
            />
          </Field>

          <Field label="Año de publicación" error={form.errorOf('publishedYear')}>
            <input
              type="number"
              name="publishedYear"
              value={form.values.publishedYear}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              className={form.errorOf('publishedYear') ? 'invalid' : ''}
            />
          </Field>

          <Field label="Páginas" error={form.errorOf('pages')}>
            <input
              type="number"
              name="pages"
              min="1"
              value={form.values.pages}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              className={form.errorOf('pages') ? 'invalid' : ''}
            />
          </Field>

          <Field label="Idioma">
            <select name="language" value={form.values.language} onChange={form.handleChange}>
              {BOOK_LANGUAGES.map((language) => (
                <option key={language} value={language}>
                  {languageName(language)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tags" hint="Ctrl + clic para elegir varios">
            <select multiple name="tags" value={form.values.tags} onChange={form.handleChange}>
              {BOOK_TAGS.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Precio (€)" error={form.errorOf('price')}>
            <input
              type="number"
              name="price"
              min="0"
              step="0.01"
              value={form.values.price}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              className={form.errorOf('price') ? 'invalid' : ''}
            />
          </Field>

          <div className="form-actions">
            <button type="submit" disabled={!form.isValid || saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <Link to="/books">Cancelar</Link>
          </div>
        </form>
      )}
    </div>
  );
}
