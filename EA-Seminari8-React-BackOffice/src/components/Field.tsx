import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

// Una etiqueta + el input que le pasen como children + su mensaje de error.
// Evita repetir el mismo bloque de HTML en cada campo de los formularios.
export function Field({ label, error, hint, className, children }: FieldProps) {
  return (
    <label className={className}>
      {label}
      {children}
      {hint && <small className="hint">{hint}</small>}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}
