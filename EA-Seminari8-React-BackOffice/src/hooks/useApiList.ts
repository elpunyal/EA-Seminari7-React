import { useCallback, useEffect, useReducer } from 'react';

import { errorMessage, isAbort } from '../utils/api-error';

interface State<T> {
  items: T[];
  loading: boolean;
  error: string;
}

type Action<T> =
  | { type: 'loaded'; items: T[] }
  | { type: 'failed'; error: string }
  | { type: 'removed'; id: string };

// useReducer: tres valores que cambian siempre juntos (items, loading y error)
// se gestionan en un solo sitio, en vez de tres useState sueltos
function reducer<T extends { _id: string }>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case 'loaded':
      return { items: action.items, loading: false, error: '' };
    case 'failed':
      return { ...state, loading: false, error: action.error };
    case 'removed':
      return { ...state, items: state.items.filter((item) => item._id !== action.id) };
  }
}

// Custom hook: pide una lista a la API cuando el componente se monta.
// IMPORTANTE: `fetcher` va en las dependencias del useEffect, así que tiene que ser una función
// estable (por ejemplo `authorService.getAuthors`). Si se pasara una flecha creada en cada render,
// el efecto se repetiría sin parar.
export function useApiList<T extends { _id: string }>(fetcher: (signal: AbortSignal) => Promise<T[]>) {
  const [state, dispatch] = useReducer(reducer<T>, { items: [], loading: true, error: '' });

  useEffect(() => {
    const controller = new AbortController();

    fetcher(controller.signal)
      .then((items) => dispatch({ type: 'loaded', items }))
      .catch((err) => {
        if (!isAbort(err)) {
          dispatch({ type: 'failed', error: errorMessage(err) });
        }
      });

    // Limpieza: si el componente se desmonta (o en desarrollo, StrictMode lo monta dos veces),
    // se cancela la petición y no se actualiza un componente que ya no existe
    return () => controller.abort();
  }, [fetcher]);

  // La API responde 204 al borrar sin datos, así que quito yo el elemento de la lista
  const removeItem = useCallback((id: string) => dispatch({ type: 'removed', id }), []);

  return { ...state, removeItem };
}
