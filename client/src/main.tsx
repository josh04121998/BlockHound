import { BrowserRouter as Router } from 'react-router-dom';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DataProvider } from './DataContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <DataProvider>
        <App />
      </DataProvider>
    </Router>
  </StrictMode>,
)
