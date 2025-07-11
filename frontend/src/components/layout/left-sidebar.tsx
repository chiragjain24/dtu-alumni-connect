import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
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
  Plus,
  Menu
} from 'lucide-react'
import { signOut } from '@/lib/auth-client'
import { ModeToggle } from '@/components/others/mode-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TweetComposerModal } from '@/components/tweets/tweet-composer-modal'
import { useUnreadNotificationsCount } from '@/lib/queries/notifications'

const LeftSidebar = () => {
  const location = useLocation()
  const [isTweetModalOpen, setIsTweetModalOpen] = useState(false)
  const { data: unreadCount } = useUnreadNotificationsCount()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  const handleCreateTweetClick = () => {
    setIsTweetModalOpen(true)
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

  const mobileNavItems = [
    { icon: Home, label: 'Home', path: '/', isActive: location.pathname === '/' },
    { icon: Briefcase, label: 'Jobs', path: '/jobs', isActive: location.pathname === '/jobs' },
    { icon: Bell, label: 'Notifications', path: '/notifications', isActive: location.pathname === '/notifications' },
    { icon: User, label: 'Profile', path: '/profile', isActive: location.pathname.startsWith('/profile') },

  ]
  const mobileMoreItems = [
    { icon: Search, label: 'Explore', path: '/explore', isActive: location.pathname === '/explore' },
    { icon: Mail, label: 'Messages', path: '/messages', isActive: location.pathname === '/messages' },
    { icon: Bookmark, label: 'Bookmarks', path: '/bookmarks', isActive: location.pathname === '/bookmarks' },
    { icon: Settings, label: 'Settings', path: '/settings', isActive: location.pathname === '/settings' },
  ]

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <div className='lg:w-[260px] hidden sm:flex h-screen w-18 sticky top-0 flex-col'>
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
                    <div className="relative">
                      <Icon className={`w-6 h-6 ${item.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      {item.label === 'Notifications' && unreadCount && unreadCount.count > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {unreadCount.count > 99 ? '99+' : unreadCount.count}
                        </div>
                      )}
                    </div>
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
            <Button 
              onClick={handleCreateTweetClick}
              className='w-full lg:w-auto lg:px-8 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full flex items-center justify-center'
            >
              <span className='hidden lg:block'>Tweet</span>
              <Plus className='lg:hidden w-6 h-6' />
            </Button>
          </div>
        </nav>

        {/* Sign Out & Theme Toggle */}
        <div className='p-3 border-t border-border flex flex-col lg:flex-row items-center lg:justify-between space-y-2 lg:space-y-0'>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className='justify-center lg:justify-start space-x-3 px-3 py-3 rounded-full hover:bg-accent'
          >
            <LogOut className='w-6 h-6 text-muted-foreground' />
            <span className='hidden lg:block text-foreground'>Sign Out</span>
          </Button>
          <div className='hidden lg:block'>
            <ModeToggle />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className='sm:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50'>
        <div className='flex items-center justify-around px-2 py-2'>
          {/* Main navigation items */}
          {mobileNavItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center p-3 rounded-lg transition-colors ${
                  item.isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-6 h-6 mb-1 ${item.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  {item.label === 'Notifications' && unreadCount && unreadCount.count > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount.count > 9 ? '9+' : unreadCount.count}
                    </div>
                  )}
                </div>
                <span className={`text-xs ${item.isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}

          {/* More menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className='flex flex-col items-center justify-center p-3 rounded-lg'
              >
                <Menu className='w-6 h-6 mb-1 text-muted-foreground' />
                <span className='text-xs text-muted-foreground'>More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-56 mb-2">
              {mobileMoreItems.map((item) => {
                const Icon = item.icon
                return (
                  <DropdownMenuItem key={item.path} asChild>
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-3 ${
                        item.isActive ? 'text-primary font-medium' : 'text-foreground'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${item.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span>{item.label}</span>
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Tweet Button */}
        <div className='absolute -top-16 right-4'>
          <Button 
            onClick={handleCreateTweetClick}
            className='w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg flex items-center justify-center'
          >
            <Plus className='w-6 h-6' />
          </Button>
        </div>
      </div>

      {/* Tweet Composer Modal */}
      <TweetComposerModal 
        open={isTweetModalOpen} 
        setOpen={setIsTweetModalOpen} 
      />
    </>
  )
}

export default LeftSidebar