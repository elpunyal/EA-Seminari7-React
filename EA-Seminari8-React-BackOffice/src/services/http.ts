import { environment } from '../config/environment';

// Error de la API con su código HTTP. status 0 = la petición ni siquiera ha llegado a la API
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Capa común de fetch. A diferencia de axios, fetch NO lanza error con un 404 o un 500:
// hay que mirar res.ok nosotros y leer el { message } que manda el gestor de errores de la API
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${environment.apiUrl}${path}`, {
      ...options,
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    });
  } catch (err) {
    // Una petición cancelada (AbortController) se deja pasar tal cual
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    // Si no hay red o el backend está apagado, fetch lanza un TypeError
    throw new ApiError('No se puede conectar con la API. ¿Está arrancado el backend del S5?', 0);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.message ?? `Error ${res.status}`, res.status);
  }

  // DELETE responde 204 sin cuerpo: no hay nada que leer con res.json()
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}
