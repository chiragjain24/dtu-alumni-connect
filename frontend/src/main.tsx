import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import TanstackQueryProvider from './providers/tanstack-query.tsx'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TanstackQueryProvider>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </TanstackQueryProvider>
  </StrictMode>,
)