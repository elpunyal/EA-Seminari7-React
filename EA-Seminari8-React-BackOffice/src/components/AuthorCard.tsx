import type { Author } from '../models';
import { formatDate, initials } from '../utils/format';

interface AuthorCardProps {
  author: Author;
  onEdit: (author: Author) => void;
  onDelete: (author: Author) => void;
}

// Componente de presentación: solo pinta un autor y avisa al padre
// cuando se pulsa Editar o Borrar (no navega ni llama a la API)
export function AuthorCard({ author, onEdit, onDelete }: AuthorCardProps) {
  return (
    <article className={author.active ? 'card' : 'card inactive'}>
      <div className="card-body">
        <div className="author-head">
          <span className="avatar">{initials(author.name)}</span>
          <div>
            <h3>{author.name}</h3>
            <span className="muted">{author.email}</span>
          </div>
        </div>
        <span>
          {author.nationality || 'Sin nacionalidad'}
          {author.birthDate && ` · ${formatDate(author.birthDate)}`}
        </span>
        <div>
          <RoleBadge role={author.role} />
          {!author.active && <span className="muted"> · Inactivo</span>}
        </div>
      </div>
      <div className="card-actions">
        <button type="button" className="secondary" onClick={() => onEdit(author)}>
          Editar
        </button>
        <button type="button" className="danger" onClick={() => onDelete(author)}>
          Borrar
        </button>
      </div>
    </article>
  );
}

// El color de la etiqueta depende del rol. En React el atributo style recibe un objeto
// (y las propiedades van en camelCase: backgroundColor, no background-color)
export function RoleBadge({ role }: { role?: string }) {
  return (
    <span className="role" style={{ backgroundColor: role === 'admin' ? '#fde2e1' : '#e3e8fb' }}>
      {role?.toUpperCase()}
    </span>
  );
}
