import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

const analyticsId = import.meta.env.VITE_GA_ID
if (analyticsId) {
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`
  document.head.appendChild(script)
  window.dataLayer = window.dataLayer || []
  window.gtag = (...args) => window.dataLayer.push(args)
  window.gtag('js', new Date())
  window.gtag('config', analyticsId)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
