import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './locale/i18n';
import { ThemeLanguageProvider } from './locale/ThemeLanguageContext';  // import the context provider

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeLanguageProvider>
      <App />
    </ThemeLanguageProvider>
  </React.StrictMode>
);
