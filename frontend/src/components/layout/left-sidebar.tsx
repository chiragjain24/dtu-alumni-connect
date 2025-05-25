import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  Search, 
  Bell, 
  Mail, 
  Bookmark, 
  User, 
  Settings,
  LogOut,
  Briefcase,
  Plus
} from 'lucide-react'
import { signOut } from '@/lib/auth-client'
import { ModeToggle } from '@/components/others/mode-toggle'

const LeftSidebar = () => {
  const location = useLocation()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  const navigationItems = [
    { icon: Home, label: 'Home', path: '/', isActive: location.pathname === '/' },
    { icon: Briefcase, label: 'Jobs', path: '/jobs', isActive: location.pathname === '/jobs' },
    { icon: Search, label: 'Explore', path: '/explore', isActive: location.pathname === '/explore' },
    { icon: Bell, label: 'Notifications', path: '/notifications', isActive: location.pathname === '/notifications' },
    { icon: Mail, label: 'Messages', path: '/messages', isActive: location.pathname === '/messages' },
    { icon: Bookmark, label: 'Bookmarks', path: '/bookmarks', isActive: location.pathname === '/bookmarks' },
    { icon: User, label: 'Profile', path: '/profile', isActive: location.pathname.startsWith('/profile') },
    { icon: Settings, label: 'Settings', path: '/settings', isActive: location.pathname === '/settings' },
  ]

  return (
    <div className='lg:w-[260px] sm:w-14 max-sm:hidden h-screen sticky top-0 flex flex-col'>
      {/* Logo */}
      <div className='p-4'>
        <Link to="/" className='flex items-center space-x-2'>
          <div className='w-8 h-8 bg-primary rounded-full flex items-center justify-center'>
            <span className='text-primary-foreground font-bold text-sm'>DTU</span>
          </div>
          <span className='hidden lg:block text-xl font-bold text-foreground'>Alumni Connect</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className='flex-1 px-2'>
        <ul className='space-y-1'>
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center justify-center lg:justify-start space-x-3 px-3 py-3 rounded-full transition-colors hover:bg-accent ${
                    item.isActive ? 'font-bold' : ''
                  }`}
                >
                  <Icon className={`w-6 h-6 ${item.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`hidden lg:block ${item.isActive ? 'text-primary' : 'text-foreground'}`}>
                    {item.label}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Tweet Button */}
        <div className='mt-6 px-3'>
          <Button className='w-full lg:w-auto lg:px-8 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full flex items-center justify-center'>
            <span className='hidden lg:block'>Tweet</span>
            <Plus className='lg:hidden w-6 h-6' />
          </Button>
        </div>
      </nav>

      {/* Sign Out */}
      <div className='p-3 border-t border-border flex items-center justify-between'>
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className='justify-center lg:justify-start space-x-3 px-3 py-3 rounded-full hover:bg-accent'
        >
          <LogOut className='w-6 h-6 text-muted-foreground' />
          <span className='hidden lg:block text-foreground'>Sign Out</span>
        </Button>
        <ModeToggle />
      </div>
    </div>
  )
}

export default LeftSidebar