import { ApiError } from '../services/http';

// Paso cualquier error capturado en un catch a un texto que se pueda enseñar en la pantalla
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return 'Ha ocurrido un error inesperado';
}

// Una petición cancelada con AbortController no es un error de verdad: se ignora
export function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
