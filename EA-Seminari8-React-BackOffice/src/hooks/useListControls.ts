import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

// Búsqueda y paginación en el navegador (la API no pagina).
// El texto y la página viven en la URL (?q=cervantes&page=2) con useSearchParams:
// así se pueden compartir o recargar sin perderlos.
// `matches` también tiene que ser una función estable (declarada fuera del componente).
export function useListControls<T>(
  items: T[],
  matches: (item: T, text: string) => boolean,
  pageSize: number,
) {
  const [params, setParams] = useSearchParams();
  const search = params.get('q') ?? '';
  const requestedPage = Number(params.get('page')) || 1;

  // useMemo: el filtro solo se recalcula si cambian los datos o el texto, no en cada render
  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();
    return items.filter((item) => matches(item, text));
  }, [items, search, matches]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  // Si borro el último elemento de la última página, así no me quedo en una página vacía
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const setSearch = (text: string) => {
    const next = new URLSearchParams(params);
    if (text) next.set('q', text);
    else next.delete('q');
    next.delete('page'); // al buscar se vuelve a la primera página
    setParams(next, { replace: true });
  };

  const setPage = (newPage: number) => {
    const next = new URLSearchParams(params);
    next.set('page', String(newPage));
    setParams(next, { replace: true });
  };

  return { search, setSearch, page, setPage, totalPages, pageItems };
}
