import { Outlet } from 'react-router-dom';

import { Navbar } from './Navbar';

// Layout de la app (nested routing): la barra de arriba se queda siempre
// y <Outlet /> es el hueco donde React Router pinta la pantalla de la ruta hija.
// En Angular esto era <router-outlet />.
export function Layout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
    </>
  );
}
