import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { useToast } from '../context/ToastContext';
import { useForm } from '../hooks/useForm';
import type { Author, AuthorRole, CreateAuthor } from '../models';
import { authorService } from '../services/author.service';
import { errorMessage, isAbort } from '../utils/api-error';
import { removeEmpty } from '../utils/remove-empty';
import { Field } from './Field';

type AuthorFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthDate: string;
  nationality: string;
  website: string;
  active: boolean;
  role: AuthorRole;
};

const INITIAL_VALUES: AuthorFormValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  birthDate: '',
  nationality: '',
  website: '',
  active: true,
  role: 'author',
};

// Reglas parecidas a las que valida el backend, así casi todos los errores se ven antes de enviar
function validate(values: AuthorFormValues) {
  const errors: Partial<Record<keyof AuthorFormValues, string>> = {};

  if (!values.name.trim()) {
    errors.name = 'El nombre es obligatorio';
  }

  if (!values.email) {
    errors.email = 'El email es obligatorio';
  } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = 'El email no tiene un formato válido';
  }

  if (!values.password) {
    errors.password = 'La contraseña es obligatoria';
  } else if (values.password.length < 8) {
    errors.password = 'Tiene que tener 8 caracteres como mínimo';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Tienes que repetir la contraseña';
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Las contraseñas no coinciden';
  }

  if (values.website && !/^https?:\/\/\S+$/.test(values.website)) {
    errors.website = 'Tiene que empezar por http:// o https://';
  }

  return errors;
}

export function AuthorForm() {
  // useParams: el :id de la ruta. En /authors/new no hay id y el formulario sirve para crear
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const form = useForm<AuthorFormValues>(INITIAL_VALUES, validate);
  const { fill } = form;

  // Estado que llega desde el botón Editar del listado (navigate(..., { state: { author } }))
  const stateAuthor = (location.state as { author?: Author } | null)?.author;

  // Empiezo en "cargando" solo si hay que pedir el autor a la API (editando y sin state)
  const [loading, setLoading] = useState(Boolean(id) && stateAuthor?._id !== id);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // useRef: el primer campo recibe el foco al abrir el formulario
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    nameRef.current?.focus();
  }, [loading]);

  useEffect(() => {
    if (!id) {
      return;
    }

    // La API nunca devuelve la contraseña, así que ese campo se queda vacío
    const fillAuthor = (author: Author) =>
      fill({
        name: author.name,
        email: author.email,
        birthDate: author.birthDate?.slice(0, 10) ?? '',
        nationality: author.nationality ?? '',
        website: author.website ?? '',
        active: author.active ?? true,
        role: author.role ?? 'author',
      });

    // Si vengo del botón Editar del listado, el autor ya viene en el state de la navegación
    if (stateAuthor?._id === id) {
      fillAuthor(stateAuthor);
      return;
    }

    // Si entro escribiendo la URL o desde otra pestaña no hay state, así que se lo pido a la API
    const controller = new AbortController();
    authorService
      .getAuthor(id, controller.signal)
      .then((author) => {
        fillAuthor(author);
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
  }, [id, stateAuthor, fill]);

  // onSubmit: el navegador recargaría la página al enviar un <form>; preventDefault lo evita
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    form.touchAll();
    if (!form.isValid) {
      return;
    }

    const { confirmPassword: _confirmPassword, ...formData } = form.values;
    const author = removeEmpty(formData) as CreateAuthor;

    setSaving(true);
    setError('');
    try {
      if (id) {
        await authorService.updateAuthor(id, author);
      } else {
        await authorService.createAuthor(author);
      }
      showToast(id ? 'Autor actualizado' : 'Autor creado');
      // replace: así el botón Atrás no vuelve a este formulario con los datos de antes de guardar
      navigate('/authors', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <div className="form-page">
      <h1>{id ? 'Editar autor' : 'Nuevo autor'}</h1>

      {error && <p className="alert">{error}</p>}

      {loading ? (
        <p className="muted">Cargando...</p>
      ) : loadFailed ? (
        <Link to="/authors">Volver a la lista de autores</Link>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <Field label="Nombre *" error={form.errorOf('name')}>
            <input
              ref={nameRef}
              type="text"
              name="name"
              value={form.values.name}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              className={form.errorOf('name') ? 'invalid' : ''}
            />
          </Field>

          <Field label="Email *" error={form.errorOf('email')}>
            <input
              type="email"
              name="email"
              value={form.values.email}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              className={form.errorOf('email') ? 'invalid' : ''}
            />
          </Field>

          <Field
            label="Contraseña *"
            error={form.errorOf('password')}
            hint={id ? 'La API también la pide al editar: se guardará la que escribas.' : undefined}
          >
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              value={form.values.password}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              className={form.errorOf('password') ? 'invalid' : ''}
            />
          </Field>

          <Field label="Repetir contraseña *" error={form.errorOf('confirmPassword')}>
            <input
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              value={form.values.confirmPassword}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              className={form.errorOf('confirmPassword') ? 'invalid' : ''}
            />
          </Field>

          <Field label="Fecha de nacimiento">
            <input
              type="date"
              name="birthDate"
              value={form.values.birthDate}
              onChange={form.handleChange}
            />
          </Field>

          <Field label="Nacionalidad">
            <input
              type="text"
              name="nationality"
              value={form.values.nationality}
              onChange={form.handleChange}
            />
          </Field>

          <Field label="Web" error={form.errorOf('website')}>
            <input
              type="url"
              name="website"
              placeholder="https://..."
              value={form.values.website}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              className={form.errorOf('website') ? 'invalid' : ''}
            />
          </Field>

          <Field label="Rol">
            <select name="role" value={form.values.role} onChange={form.handleChange}>
              <option value="author">Autor</option>
              <option value="admin">Administrador</option>
            </select>
          </Field>

          <Field label="" className="checkbox">
            <input
              type="checkbox"
              name="active"
              checked={form.values.active}
              onChange={form.handleChange}
            />
            Activo
          </Field>

          <div className="form-actions">
            {/* El botón se desactiva si el formulario no es válido o se está guardando */}
            <button type="submit" disabled={!form.isValid || saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <Link to="/authors">Cancelar</Link>
          </div>
        </form>
      )}
    </div>
  );
}
