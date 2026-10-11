import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

// Tiempo que espero desde la última tecla antes de buscar
const SEARCH_DELAY = 300;

// Búsqueda y página de una lista. La búsqueda y la paginación las hace la API (ver useApiPage);
// aquí solo se guarda qué texto y qué página se piden.
// El texto y la página viven en la URL (?q=cervantes&page=2) con useSearchParams:
// así se pueden compartir o recargar sin perderlos.
export function useListControls() {
  const [params, setParams] = useSearchParams();
  const search = params.get('q') ?? '';
  const page = Math.max(1, Number(params.get('page')) || 1);

  // Lo que se ve en el input. Cada tecla lo cambia al momento, pero a la URL (y por tanto a
  // la API) solo llega cuando se deja de escribir un momento: así no hay una petición por letra
  const [searchText, setSearchText] = useState(search);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Último texto que he puesto yo en la URL
  const written = useRef(search);

  // Si la URL cambia por otro lado (botón Atrás, el enlace del menú...) pongo el input al día
  useEffect(() => {
    if (search !== written.current) {
      written.current = search;
      setSearchText(search);
    }
  }, [search]);

  // Limpieza: si salgo de la pantalla con una búsqueda a medias, se cancela
  useEffect(() => () => clearTimeout(timer.current), []);

  const setSearch = (text: string) => {
    setSearchText(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      written.current = text;
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (text) next.set('q', text);
          else next.delete('q');
          next.delete('page'); // al buscar se vuelve a la primera página
          return next;
        },
        { replace: true },
      );
    }, SEARCH_DELAY);
  };

  const setPage = (newPage: number) => {
    const next = new URLSearchParams(params);
    next.set('page', String(newPage));
    setParams(next, { replace: true });
  };

  return { search, searchText, setSearch, page, setPage };
}
