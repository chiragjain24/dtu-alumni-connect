// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import RoutesHandler from './routes.tsx'
import TanstackQueryProvider from './lib/providers/tanstack-query.tsx'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from './lib/providers/theme-provider.tsx'
import { Toaster } from '@/components/ui/sonner'
import { UploadProvider } from './lib/providers/upload-provider'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <TanstackQueryProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <UploadProvider>
          <RoutesHandler />
          <Toaster position="top-right" />
          {/* <ReactQueryDevtools initialIsOpen={false} /> */}
        </UploadProvider>
      </ThemeProvider>
    </TanstackQueryProvider>
  // </StrictMode>,
)