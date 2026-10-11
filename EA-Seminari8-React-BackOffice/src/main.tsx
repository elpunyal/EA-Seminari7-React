import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { ToastProvider } from './context/ToastContext';
import './index.css';

// Punto de entrada (CSR): el index.html solo trae <div id="root"></div> y React pinta la app ahí.
// Los "providers" envuelven la app: BrowserRouter da las rutas y ToastProvider el contexto global.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
