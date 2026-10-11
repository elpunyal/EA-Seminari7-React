import type { ViewMode } from '../stores/viewMode';

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

// Botones para elegir si la lista se ve en tabla o en tarjetas.
// Es un componente "controlado": el padre le da el valor (mode) y le dice qué hacer al cambiar.
export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="view-toggle" role="group" aria-label="Modo de vista">
      <button
        type="button"
        className={mode === 'list' ? 'active' : ''}
        aria-pressed={mode === 'list'}
        onClick={() => onChange('list')}
      >
        Lista
      </button>
      <button
        type="button"
        className={mode === 'cards' ? 'active' : ''}
        aria-pressed={mode === 'cards'}
        onClick={() => onChange('cards')}
      >
        Tarjetas
      </button>
    </div>
  );
}
