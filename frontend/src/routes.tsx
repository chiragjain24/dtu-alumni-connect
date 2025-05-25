import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthGuard from './components/AuthGuard'
import Login from './pages/Login'
import ProfileSetup from './pages/ProfileSetup'
import Home from './pages/Home'
import RootLayout from './components/layout/root-layout'

function RoutesHandler() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
        <Route 
          path="/profile/setup" 
          element={
            <AuthGuard>
              <RootLayout>
                <ProfileSetup />
              </RootLayout>
            </AuthGuard>
          } 
        />
        
        <Route 
          path="/" 
          element={
            <AuthGuard>
              <RootLayout>
                <Home />
              </RootLayout>
            </AuthGuard>
          } 
        />
        
        {/* Redirect any unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default RoutesHandler
