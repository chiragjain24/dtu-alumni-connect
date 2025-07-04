import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthGuard from './components/AuthGuard'
import Login from './pages/Login'
import ProfileSetup from './pages/ProfileSetup'
import Home from './pages/Home'
import Explore from './pages/Explore'
import Jobs from './pages/Jobs'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import TweetDetail from './pages/TweetDetail'
import Bookmarks from './pages/Bookmarks'
import RootLayout from './components/layout/root-layout'

// Placeholder components for Phase 2
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="min-h-screen">
    <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 z-10">
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
    </div>
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold text-foreground mb-4">{title}</h2>
      <p className="text-muted-foreground mb-4">This page will be implemented in future phases.</p>
    </div>
  </div>
)

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
            <AuthGuard isProfileSetup={true}>
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

        {/* Navigation routes */}
        <Route 
          path="/explore" 
          element={
            <AuthGuard>
              <RootLayout>
                <Explore />
              </RootLayout>
            </AuthGuard>
          } 
        />

        <Route 
          path="/notifications" 
          element={
            <AuthGuard>
              <RootLayout>
                <PlaceholderPage title="Notifications" />
              </RootLayout>
            </AuthGuard>
          } 
        />

        <Route 
          path="/messages" 
          element={
            <AuthGuard>
              <RootLayout>
                <PlaceholderPage title="Messages" />
              </RootLayout>
            </AuthGuard>
          } 
        />

        <Route 
          path="/bookmarks" 
          element={
            <AuthGuard>
              <RootLayout>
                <Bookmarks />
              </RootLayout>
            </AuthGuard>
          } 
        />

        <Route 
          path="/jobs" 
          element={
            <AuthGuard>
              <RootLayout>
                <Jobs />
              </RootLayout>
            </AuthGuard>
          } 
        />

        <Route 
          path="/profile" 
          element={
            <AuthGuard>
              <RootLayout>
                <Profile />
              </RootLayout>
            </AuthGuard>
          } 
        />

        <Route 
          path="/profile/:username" 
          element={
            <AuthGuard>
              <RootLayout>
                <Profile />
              </RootLayout>
            </AuthGuard>
          } 
        />

        <Route 
          path="/settings" 
          element={
            <AuthGuard>
              <RootLayout>
                <Settings />
              </RootLayout>
            </AuthGuard>
          } 
        />

        <Route 
          path="/tweet/:id" 
          element={
            <AuthGuard>
              <RootLayout>
                <TweetDetail />
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
