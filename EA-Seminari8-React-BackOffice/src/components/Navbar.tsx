import { Link, NavLink } from 'react-router-dom';

export function Navbar() {
  return (
    <header className="navbar">
      <Link className="brand" to="/">
        Backoffice
      </Link>

      {/* NavLink le pone la clase "active" al enlace de la página en la que estoy */}
      <nav>
        <NavLink to="/authors">Autores</NavLink>
        <NavLink to="/books">Libros</NavLink>
      </nav>
    </header>
  );
}
