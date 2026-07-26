import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    window.setTimeout(() => {
      void navigator.serviceWorker
        .register('/service-worker.js', { updateViaCache: 'none' })
        .catch(() => undefined)
    }, 0)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
