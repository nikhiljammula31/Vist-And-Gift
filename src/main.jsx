import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { QuoteProvider } from './context/QuoteContext';
import { CartProvider } from './context/CartContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <QuoteProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </QuoteProvider>
    </BrowserRouter>
  </StrictMode>,
);
