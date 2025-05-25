// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import RoutesHandler from './routes.tsx'
import TanstackQueryProvider from './lib/providers/tanstack-query.tsx'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from './lib/providers/theme-provider.tsx'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <TanstackQueryProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <RoutesHandler />
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </TanstackQueryProvider>
  // </StrictMode>,
)