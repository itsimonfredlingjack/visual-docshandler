import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/layout.css'
import './styles/pipeline.css'
import './styles/chat.css'
import './styles/review.css'
import './styles/retrieval.css'
import './styles/specimen.css'
import './styles/docpage.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
