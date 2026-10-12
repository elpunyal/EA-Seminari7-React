import type { Author } from '../models';

interface Props {
  author: Author;
  onEdit: (author: Author) => void;
  onDelete: (author: Author) => void;
}

export default function AuthorCard({ author, onEdit, onDelete }: Props) {
  return (
    <article className="author-card">
      {/* <img
        className="card-cover"
        src={`https://picsum.photos/seed/${author._id}/400/240`}
        alt={`Foto de ${author.name}`}
      /> */}
      <div className="card-body-bo">
        <h3>{author.name}</h3>
        <span className="muted">{author.email}</span>
        <span>{author.nationality}</span>
      </div>
      <div className="card-actions-bo">
        <button onClick={() => onEdit(author)}>Editar</button>
        <button onClick={() => onDelete(author)}>Borrar</button>
      </div>
    </article>
  );
}