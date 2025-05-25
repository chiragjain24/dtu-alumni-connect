import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { MoreHorizontal, Heart, MessageCircle, Repeat2, Share } from 'lucide-react'

interface TweetCardProps {
  user: {
    name: string
    username: string
    avatar?: string | null
  }
  content: string
  timestamp: string
  stats: {
    replies: number
    retweets: number
    likes: number
  }
  isLiked?: boolean
  isRetweeted?: boolean
}

export function TweetCard({ 
  user, 
  content, 
  timestamp, 
  stats, 
  isLiked = false, 
  isRetweeted = false 
}: TweetCardProps) {
  return (
    <div className="p-4 hover:bg-accent/50 transition-colors cursor-pointer border-b border-border">
      <div className="flex space-x-3">
        <Avatar className="w-12 h-12">
          <AvatarImage src={user.avatar || undefined} alt={`${user.name} avatar`} />
          <AvatarFallback>
            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-foreground hover:underline">{user.name}</h3>
            <span className="text-muted-foreground">@{user.username}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{timestamp}</span>
            <div className="ml-auto">
              <Button variant="ghost" size="sm" className="rounded-full">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="mt-1">
            <p className="text-foreground whitespace-pre-wrap">{content}</p>
          </div>

          <div className="flex items-center justify-between max-w-md mt-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-2 text-muted-foreground hover:text-primary rounded-full"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{stats.replies}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className={`flex items-center space-x-2 rounded-full ${
                isRetweeted 
                  ? 'text-green-600' 
                  : 'text-muted-foreground hover:text-green-600'
              }`}
            >
              <Repeat2 className="w-4 h-4" />
              <span className="text-sm">{stats.retweets}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className={`flex items-center space-x-2 rounded-full ${
                isLiked 
                  ? 'text-red-500' 
                  : 'text-muted-foreground hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm">{stats.likes}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-2 text-muted-foreground hover:text-primary rounded-full"
            >
              <Share className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 