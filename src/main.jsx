import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { TaalProvider } from './i18n'
import { API_URL } from './services/api'
import { installeerCsrfFetch } from './services/csrfFetch'

// Vóór de eerste render: ook losse fetch-aanroepen naar de API krijgen de CSRF-header.
installeerCsrfFetch(window, API_URL)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TaalProvider>
      <App />
    </TaalProvider>
  </StrictMode>,
)
