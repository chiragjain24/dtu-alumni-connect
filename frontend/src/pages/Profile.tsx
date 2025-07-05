import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Calendar, GraduationCap, Building, LinkIcon, Edit, Users} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/others/back-button'
import { Avatar } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import useGetMyProfile from '@/lib/queries'
import { useGetUserProfile } from '@/lib/queries/users'
import { UserTweetsTimeline } from '@/components/users/user-tweets-timeline'
import { UserLikesTimeline } from '@/components/users/user-likes-timeline'
import { UserRepliesTimeline } from '@/components/users/user-replies-timeline'
import Loader from '@/components/loader'

export default function Profile() {
  const navigate = useNavigate()
  const { username } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: myProfile, isPending: myProfilePending } = useGetMyProfile(!username)
  const { data: userProfile, isPending: userProfilePending } = useGetUserProfile(username || '')
  
  // Get tab from URL query parameter, default to 'tweets'
  const activeTab = (searchParams.get('tab') as 'tweets' | 'replies' | 'media' | 'likes') || 'tweets'

  const isMyProfile = !username || username === myProfile?.user.username

  // Function to handle tab changes
  const handleTabChange = (tab: 'tweets' | 'replies' | 'media' | 'likes') => {
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.set('tab', tab)
    setSearchParams(newSearchParams)
  }

  // Determine which profile to show
  const profile = isMyProfile ? myProfile : userProfile
  const isPending = isMyProfile ? myProfilePending : userProfilePending

  if (isPending) return <Loader />

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Profile not found</h2>
          <p className="text-muted-foreground mb-4">
            {username ? `User @${username} not found` : 'Unable to load profile information'}
          </p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    )
  }

  const user = profile.user

  const formatJoinDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    })
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 z-10 flex items-center gap-4">
        <BackButton />
        <div className="h-[2rem] flex flex-col justify-center">
          <h1 className="text-xl font-bold">{user.name}</h1>
          {/* <p className="text-xs text-muted-foreground">{totalTweetCount} posts</p> */}
        </div>
      </div>

      {/* Profile Header */}
      <div className="relative">
        {/* Cover Photo */}
        <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        
        {/* Profile Info */}
        <div className="px-4 pb-4">
          <div className="flex justify-between items-start -mt-16 mb-4">
            <Avatar className="w-32 h-32 border-4 border-background">
              <img 
                src={user.image || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} 
                alt={user.name}
                className="w-full h-full object-cover"
              />
            </Avatar>
            {isMyProfile ? (
              <Button 
                variant="outline" 
                className="mt-16"
                onClick={() => navigate('/settings')}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit profile
              </Button>
            ) : (
              <Button 
                variant="outline" 
                className="mt-16"
              >
                Follow
              </Button>
            )}
          </div>

          {/* User Info */}
          <div className="space-y-3">
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-muted-foreground">@{user.username || 'username'}</p>
            </div>

            {user.bio && (
              <p className="text-foreground">{user.bio}</p>
            )}

            {/* Alumni Info */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {user.graduationYear && user.branch && (
                <div className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4" />
                  <span>DTU {user.branch} '{user.graduationYear.toString().slice(-2)}</span>
                </div>
              )}
              
              {user.currentCompany && (
                <div className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  <span>{user.currentRole ? `${user.currentRole} at ${user.currentCompany}` : user.currentCompany}</span>
                </div>
              )}

              {user.linkedinUrl && (
                <div className="flex items-center gap-1">
                  <LinkIcon className="w-4 h-4" />
                  <a 
                    href={user.linkedinUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    LinkedIn
                  </a>
                </div>
              )}

              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {formatJoinDate(user.createdAt)}</span>
              </div>
            </div>

            {/* Following/Followers */}
            <div className="flex gap-4 text-sm">
              <button className="hover:underline">
                <span className="font-bold">0</span>
                <span className="text-muted-foreground ml-1">Following</span>
              </button>
              <button className="hover:underline">
                <span className="font-bold">0</span>
                <span className="text-muted-foreground ml-1">Followers</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex">
          {(['tweets', 'replies', 'media', 'likes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`flex-1 py-4 text-center font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-foreground border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'tweets' && (
          <UserTweetsTimeline 
            userId={profile.user.id}
            isMyProfile={isMyProfile}
            username={username || ''}
          />
        )}

        {activeTab === 'replies' && (
          <UserRepliesTimeline 
            userId={profile.user.id}
            isMyProfile={isMyProfile}
            username={username || ''}
          />
        )}

        {activeTab === 'media' && (
          <Card className="shadow-none border-none">
            <CardContent className="p-8 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">No media yet</h3>
                  <p className="text-muted-foreground">
                    When you post photos and videos, they'll show up here.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'likes' && (
          <UserLikesTimeline 
            userId={profile.user.id}
            isMyProfile={isMyProfile}
            username={username || ''}
          />
        )}
      </div>
    </div>
  )
} 