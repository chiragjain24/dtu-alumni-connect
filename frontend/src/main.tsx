import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import RoutesHandler from './routes.tsx'
import TanstackQueryProvider from './lib/providers/tanstack-query.tsx'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <TanstackQueryProvider>
      <RoutesHandler />
      <ReactQueryDevtools initialIsOpen={false} />
    </TanstackQueryProvider>
  // </StrictMode>,
)