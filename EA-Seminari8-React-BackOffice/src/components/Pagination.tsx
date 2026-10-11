import type { FC } from 'react';

// Las props son de solo lectura y van de padre a hijo (flujo unidireccional).
// El hijo no cambia la página: le avisa al padre llamando a onPageChange (en Angular era output()).
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// React.FC es la forma de tipar un componente de función. También vale escribir
// function Pagination(props: PaginationProps), que es lo que usan el resto de componentes.
export const Pagination: FC<PaginationProps> = ({ page, totalPages, onPageChange }) => {
  return (
    <div className="pagination">
      <button
        type="button"
        className="secondary"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Anterior
      </button>

      <span>
        Página {page} de {totalPages}
      </span>

      <button
        type="button"
        className="secondary"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Siguiente
      </button>
    </div>
  );
};
