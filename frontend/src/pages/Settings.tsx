import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { User, Shield, Bell, Palette, LogOut, Save, ArrowLeft } from 'lucide-react'
import { signOut } from '@/lib/auth-client'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { api } from '../lib/utils'
import useGetMyProfile from '@/lib/queries'
import Loader from '@/components/loader'
import { ModeToggle } from '@/components/others/mode-toggle'
import { toast } from 'sonner'

const DTU_BRANCHES = [
  'Computer Science and Engineering',
  'Information Technology',
  'Software Engineering',
  'Mathematics and Computing',
  'Electronics and Communication Engineering',
  'Electrical Engineering',
  'Engineering Physics',
  'Mechanical Engineering',
  'Production and Industrial Engineering',
  'Chemical Engineering',
  'Civil Engineering',
  'Environmental Engineering',
  'Biotechnology',
]

type SettingsTab = 'profile' | 'account' | 'notifications' | 'appearance'

export default function Settings() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: profile, isPending } = useGetMyProfile()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    graduationYear: '',
    branch: '',
    currentCompany: '',
    currentRole: '',
    linkedinUrl: ''
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await api.users.profile.$patch({
        json: {
          ...data,
          graduationYear: data.graduationYear ? parseInt(data.graduationYear) : undefined,
        }
      })
      if (!res.ok) {
        throw new Error('Failed to update profile')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] })
      // Show success message or toast here
      toast.success('Profile updated successfully',{
        position: 'top-center',
      })
    },
    onError: () => {
      toast.error('Failed to update profile',{
        position: 'top-center',
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfileMutation.mutate(formData)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.user.username || '',
        bio: profile.user.bio || '',
        graduationYear: profile.user.graduationYear?.toString() || '',
        branch: profile.user.branch || '',
        currentCompany: profile.user.currentCompany || '',
        currentRole: profile.user.currentRole || '',
        linkedinUrl: profile.user.linkedinUrl || ''
      })
    }
  }, [profile])

  if (isPending) return <Loader />

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'account' as const, label: 'Account', icon: Shield },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
  ]

  const renderProfileSettings = () => (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your profile information that other alumni can see
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username*</Label>
              <Input
                id="username"
                value={formData.username}
                minLength={3}
                maxLength={50}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="@johndoe"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="graduationYear">Graduation Year*</Label>
              <Input
                id="graduationYear"
                type="number"
                min="1940"
                max={new Date().getFullYear()+6}
                value={formData.graduationYear}
                onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                placeholder="2020"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
            <Input
              id="linkedinUrl"
              type="url"
              value={formData.linkedinUrl}
              onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch">Branch</Label>
            <Select value={formData.branch} onValueChange={(value) => handleInputChange('branch', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your branch" />
              </SelectTrigger>
              <SelectContent>
                {DTU_BRANCHES.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentCompany">Current Company</Label>
              <Input
                id="currentCompany"
                value={formData.currentCompany}
                onChange={(e) => handleInputChange('currentCompany', e.target.value)}
                placeholder="Google, Microsoft, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currentRole">Current Role</Label>
              <Input
                id="currentRole"
                value={formData.currentRole}
                onChange={(e) => handleInputChange('currentRole', e.target.value)}
                placeholder="Software Engineer, Product Manager, etc."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            disabled={updateProfileMutation.isPending || !formData.username || !formData.graduationYear}
            className="w-full md:w-auto"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )

  const renderAccountSettings = () => (
    <div className="space-y-6">

      {/* Mobile Sign Out Card */}
      <Card className="sm:hidden">
        <CardHeader>
          <CardTitle>Sign Out</CardTitle>
          <CardDescription>
            Sign out of your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Manage your account settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile?.user.email || ''} disabled />
            <p className="text-sm text-muted-foreground">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Account Created</Label>
            <Input 
              value={profile?.user.createdAt ? new Date(profile.user.createdAt).toLocaleDateString() : ''} 
              disabled 
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" disabled className="w-full md:w-auto">
            <LogOut className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const renderNotificationSettings = () => (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Choose what notifications you want to receive
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Notification settings will be available in a future update.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Email Notifications</h4>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Push Notifications</h4>
                <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderAppearanceSettings = () => (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize how the app looks and feels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Theme</h4>
                <p className="text-sm text-muted-foreground">Switch between light, dark, and system themes</p>
              </div>
              <ModeToggle />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Font Size</h4>
                <p className="text-sm text-muted-foreground">Adjust text size for better readability</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      <div className="flex flex-col">
        {/* Sidebar */}
        <div className="border-r border-border">
          <div className="p-4">
            <nav className="space-y-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 pt-0">
          {activeTab === 'profile' && renderProfileSettings()}
          {activeTab === 'account' && renderAccountSettings()}
          {activeTab === 'notifications' && renderNotificationSettings()}
          {activeTab === 'appearance' && renderAppearanceSettings()}
        </div>
      </div>
    </div>
  )
} 