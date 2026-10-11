// Lo que se le manda a la API para pedir una página de un listado: /authors?page=2&limit=4&q=texto
export interface PageQuery {
  page: number;
  limit: number;
  q: string;
}

// Una página de un listado: los elementos que se ven y los datos para pintar la paginación
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}
