import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { QuizSessionProvider } from './context/QuizSessionContext';
import { ToastProvider } from './context/ToastContext';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <QuizSessionProvider>
          <App />
        </QuizSessionProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
