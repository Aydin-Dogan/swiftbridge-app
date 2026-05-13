import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { TaalProvider } from './i18n'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TaalProvider>
      <App />
    </TaalProvider>
  </StrictMode>,
)
