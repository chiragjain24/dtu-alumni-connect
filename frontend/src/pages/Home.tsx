import { signOut } from '../lib/auth-client'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import useGetProfile from '@/lib/hooks/get-profile'

export default function Home() {
  const { data: profile, isPending } = useGetProfile();

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">DTU Alumni Connect</h1>
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>Alumni information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile?.user.image && (
                  <img 
                    src={profile.user.image} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-full"
                  />
                )}
                <div>
                  <h3 className="font-semibold">{profile?.user.name}</h3>
                  <p className="text-sm text-gray-600">@{profile?.user.username}</p>
                </div>
                
                {profile?.user.bio && (
                  <p className="text-sm text-gray-700">{profile.user.bio}</p>
                )}
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Graduation:</span> {profile?.user.graduationYear}
                  </div>
                  <div>
                    <span className="font-medium">Branch:</span> {profile?.user.branch}
                  </div>
                  {profile?.user.currentCompany && (
                    <div>
                      <span className="font-medium">Company:</span> {profile.user.currentCompany}
                    </div>
                  )}
                  {profile?.user.currentRole && (
                    <div>
                      <span className="font-medium">Role:</span> {profile.user.currentRole}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Welcome to DTU Alumni Connect!</CardTitle>
                <CardDescription>
                  Connect with your fellow DTU alumni
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Phase 1 Complete! 🎉
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Authentication and user profile system is now working.
                  </p>
                  <p className="text-sm text-gray-500">
                    Next up: Twitter-like UI and tweet system in Phase 2 & 3
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
} 