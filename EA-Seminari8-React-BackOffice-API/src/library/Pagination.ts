import { Request } from 'express';

// Lo que hace falta para pedir una pagina de un listado
export interface PageQuery {
    page: number;
    limit: number;
    q: string;
}

// Elementos por pagina si no se indica limit, y el maximo que dejamos pedir de una vez
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// Lee page, limit y q de la URL (por ejemplo /books?page=2&limit=4&q=quijote).
// Si no llega ni page ni limit devolvemos null y el listado se devuelve entero, como antes.
export const readPageQuery = (query: Request['query']): PageQuery | null => {
    if (query.page === undefined && query.limit === undefined) {
        return null;
    }

    // Si llega algo que no es un numero nos quedamos con el valor por defecto
    const page = Math.max(1, parseInt(String(query.page), 10) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(String(query.limit), 10) || DEFAULT_LIMIT));
    const q = typeof query.q === 'string' ? query.q.trim() : '';

    return { page, limit, q };
};

// Convierte el texto del buscador en una expresion regular que no distingue mayusculas.
// Escapamos los caracteres especiales para que un "." o un "(" se busquen tal cual.
export const searchRegex = (text: string) => new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
