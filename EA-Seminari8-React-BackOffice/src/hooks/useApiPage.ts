import { useCallback, useEffect, useReducer, useState } from 'react';

import type { Page, PageQuery } from '../models';
import { errorMessage, isAbort } from '../utils/api-error';

interface State<T> {
  items: T[];
  page: number;
  totalPages: number;
  loading: boolean;
  error: string;
}

type Action<T> = { type: 'loaded'; result: Page<T> } | { type: 'failed'; error: string };

function reducer<T>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case 'loaded':
      return {
        items: action.result.items,
        page: action.result.page,
        totalPages: action.result.totalPages,
        loading: false,
        error: '',
      };
    case 'failed':
      return { ...state, loading: false, error: action.error };
  }
}

// Paginación en el backend: en vez de traer la lista entera (useApiList), pide a la API
// solo la página que se ve. Cada vez que cambia la página o el texto del buscador se hace
// una petición nueva. `fetchPage` tiene que ser una función estable, igual que en useApiList
// (por ejemplo `authorService.getAuthorsPage`).
export function useApiPage<T>(
  fetchPage: (query: PageQuery, signal: AbortSignal) => Promise<Page<T>>,
  page: number,
  limit: number,
  q: string,
) {
  const [state, dispatch] = useReducer(reducer<T>, {
    items: [],
    page: 1,
    totalPages: 1,
    loading: true,
    error: '',
  });
  // Contador para repetir la petición aunque no cambien ni la página ni el texto
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetchPage({ page, limit, q }, controller.signal)
      .then((result) => dispatch({ type: 'loaded', result }))
      .catch((err) => {
        if (!isAbort(err)) {
          dispatch({ type: 'failed', error: errorMessage(err) });
        }
      });

    // Si se cambia de página antes de que llegue la respuesta, la petición anterior se cancela
    return () => controller.abort();
  }, [fetchPage, page, limit, q, version]);

  // Después de borrar vuelvo a pedir la página: así se rellena el hueco con el siguiente
  // elemento y el número de páginas queda bien
  const reload = useCallback(() => setVersion((current) => current + 1), []);

  return { ...state, reload };
}
