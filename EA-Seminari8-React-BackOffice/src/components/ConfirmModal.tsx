import { useEffect } from 'react';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title = '¿Estás seguro?',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  // useEffect con limpieza: mientras el modal está abierto escucho la tecla Escape.
  // El return quita el listener cuando se cierra el modal (o se desmonta el componente)
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  // Renderizado condicional: si no está abierto, el componente no pinta nada
  if (!open) {
    return null;
  }

  return (
    <div className="overlay" onClick={onCancel}>
      {/* stopPropagation: un clic dentro del modal no debe cerrarlo */}
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="actions">
          <button type="button" className="secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button type="button" className="danger" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
