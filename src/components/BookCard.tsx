import type { Book } from '../models';

interface Props {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
}

export default function BookCard({ book, onEdit, onDelete }: Props) {
  const authorNames = book.authors
    .map((author) => ('name' in author ? author.name : String(author)))
    .join(', ');

  return (
    <article className="book-card">
       <img
        className="card-cover"
        src={`https://picsum.photos/seed/${book._id}/400/240`}
        alt={`Foto de ${book.title}`}
      /> 
      <div className="card-body-bo">
        <h3>{book.title}</h3>
        <span className="muted">{authorNames}</span>
        <span>{book.publishedYear}</span>
      </div>
      <div className="card-actions-bo">
        <button onClick={() => onEdit(book)}>Editar</button>
        <button onClick={() => onDelete(book)}>Borrar</button>
      </div>
    </article>
  );
}