import { Navigate, Route, Routes } from 'react-router-dom';

import { AuthorForm } from './components/AuthorForm';
import { AuthorsList } from './components/AuthorsList';
import { BookForm } from './components/BookForm';
import { BooksList } from './components/BooksList';
import { Layout } from './components/Layout';

// Rutas de la app (React Router v6+). Todas cuelgan de <Layout />, que pinta la barra de arriba
// y deja un <Outlet /> para la pantalla de cada ruta (nested routing).
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/authors" replace />} />
        <Route path="/authors" element={<AuthorsList />} />
        <Route path="/authors/new" element={<AuthorForm />} />
        <Route path="/authors/:id/edit" element={<AuthorForm />} />
        <Route path="/books" element={<BooksList />} />
        <Route path="/books/new" element={<BookForm />} />
        <Route path="/books/:id/edit" element={<BookForm />} />
        {/* Cualquier otra URL vuelve al listado de autores */}
        <Route path="*" element={<Navigate to="/authors" replace />} />
      </Route>
    </Routes>
  );
}
