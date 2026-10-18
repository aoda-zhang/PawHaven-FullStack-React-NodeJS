import '@pawhaven/ui/index.css';
import '@pawhaven/frontend-core/index.css';
import './app/index.css';

import React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}
createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
