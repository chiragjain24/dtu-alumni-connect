import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AuthGuard from './components/AuthGuard'
import Login from './pages/Login'
import ProfileSetup from './pages/ProfileSetup'
import Home from './pages/Home'

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
        <Route 
          path="/profile/setup" 
          element={
            <AuthGuard>
              <ProfileSetup />
            </AuthGuard>
          } 
        />
        
        <Route 
          path="/" 
          element={
            <AuthGuard>
              <Home />
            </AuthGuard>
          } 
        />
        
        {/* Redirect any unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
