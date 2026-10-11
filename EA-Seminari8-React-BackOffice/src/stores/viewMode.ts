import { atom } from 'nanostores';
import type { WritableAtom } from 'nanostores';

export type ViewMode = 'list' | 'cards';

// Estado global con una librería muy pequeña: Nanostores.
// Un `atom` es un valor que vive FUERA de los componentes. Cualquier componente lo lee con
// useStore(atom) y se vuelve a pintar solo cuando cambia; se modifica con atom.set(valor).
function persistentViewMode(key: string): WritableAtom<ViewMode> {
  let initial: ViewMode = 'list';
  try {
    initial = localStorage.getItem(key) === 'cards' ? 'cards' : 'list';
  } catch {
    // localStorage no disponible: se empieza en lista
  }

  const store = atom<ViewMode>(initial);
  // Cada vez que cambia el modo lo guardo en el navegador, así al volver sigue igual
  store.listen((mode) => {
    try {
      localStorage.setItem(key, mode);
    } catch {
      // da igual si no se puede guardar
    }
  });
  return store;
}

export const authorsView = persistentViewMode('authors-view');
export const booksView = persistentViewMode('books-view');
