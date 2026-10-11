import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

interface Toast {
  id: number;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string) => void;
}

// Context API: estado global sin "prop drilling". Cualquier componente de la app puede avisar
// con showToast() sin que nadie le haya pasado la función por props, pase por los niveles que pase.
const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string) => {
    const id = nextId++;
    setToasts((current) => [...current, { id, message }]);
    // A los 3 segundos el aviso desaparece solo
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3000);
  }, []);

  // useMemo: el objeto del contexto se crea una sola vez. Con un objeto nuevo en cada render,
  // todos los componentes que usan useToast() se volverían a pintar cada vez que sale un aviso
  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" role="status">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast">
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Custom hook sobre useContext: los componentes llaman a useToast() y no se enteran del Context
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast tiene que usarse dentro de <ToastProvider>');
  }
  return context;
}
