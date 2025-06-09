import { useState } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from './avatar'
import { Button } from './button'
import { Calendar, Building, GraduationCap, ExternalLink } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useGetUserProfile } from '@/lib/queries/users'
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
  } from "@/components/ui/hover-card"

interface ProfileHoverCardProps {
  children: React.ReactNode
  username: string
}

export function ProfileHoverCard({ 
  children, 
  username, 
}: ProfileHoverCardProps) {
  const [shouldFetch, setShouldFetch] = useState(false)
  const navigate = useNavigate()

  // Fetch user profile data only when needed
  const { data: userProfile, isPending: isLoading } = useGetUserProfile(username, shouldFetch)

  const formatJoinDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const user = userProfile?.user

  return (
    <HoverCard onOpenChange={(open) => setShouldFetch(open)}>
        <HoverCardTrigger data-action="prevent">
            {children}
        </HoverCardTrigger>

        <HoverCardContent data-action="prevent" className="w-80">
            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
            ) : user ? (
            <div className="space-y-3">
                {/* Header with avatar and basic info */}
                <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                    <AvatarImage 
                        src={user.image || undefined} 
                        alt={`${user.name} avatar`} 
                    />
                    <AvatarFallback>
                        {user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                    </Avatar>
                    <div>
                    <Link 
                        to={`/profile/${username}`}
                        className="font-bold text-foreground hover:underline"
                    >
                        {user.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                </div>
                <Button
                    size="sm"
                    variant="default"
                    className="px-4 py-1 rounded-full"
                    onClick={() => {
                    navigate(`/profile/${username}`)
                    }}
                >
                    View Profile
                </Button>
                </div>

                {/* Bio */}
                {user.bio && (
                <p className="text-sm text-foreground">{user.bio}</p>
                )}

                {/* Alumni and work info */}
                <div className="space-y-2">
                {user.graduationYear && user.branch && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GraduationCap className="w-4 h-4" />
                    <span>DTU {user.branch} '{user.graduationYear.toString().slice(-2)}</span>
                    {user.isAlumniVerified && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        Verified Alumni
                        </span>
                    )}
                    </div>
                )}
                
                {user.currentCompany && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building className="w-4 h-4" />
                    <span>
                        {user.currentRole ? `${user.currentRole} at ${user.currentCompany}` : user.currentCompany}
                    </span>
                    </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatJoinDate(user.createdAt)}</span>
                </div>

                {user.linkedinUrl && (
                    <div className="flex items-center gap-2 text-sm">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    <a 
                        href={user.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                    >
                        LinkedIn Profile
                    </a>
                    </div>
                )}
                </div>
            </div>
            ) : (
            <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Failed to load profile</p>
            </div>
            )}
        </HoverCardContent>
    </HoverCard>

  )
} 