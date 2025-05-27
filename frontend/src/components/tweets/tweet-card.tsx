import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Heart, MessageCircle, Repeat2, Share, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Tweet } from '@/types/types'
import { useLikeTweet, useRetweetTweet, useDeleteTweet } from '@/lib/queries/tweets'
import { useSession } from '@/lib/auth-client'

interface TweetCardProps {
  tweet: Tweet
}

export function TweetCard({ 
  tweet, 
}: TweetCardProps) {
  const navigate = useNavigate()
  const { data: session } = useSession()
  const likeMutation = useLikeTweet()
  const retweetMutation = useRetweetTweet()
  const deleteMutation = useDeleteTweet()
  
  // Check if current user is the author of this tweet
  const isAuthor = session?.user.id === tweet.authorId

  const handleLike = async () => {
    await likeMutation.mutateAsync({tweet, isLike: !tweet.isLikedByUser})
  }

  const handleRetweet = async () => {
    await retweetMutation.mutateAsync(tweet)
  }

  const handleReply = () => {
    navigate(`/tweet/${tweet.id}`)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this tweet?')) {
      await deleteMutation.mutateAsync(tweet.id)
    }
  }
  
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  const handleTweetClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    navigate(`/tweet/${tweet.id}`);
  };

  return (
    <div 
      className="p-4 hover:bg-accent/50 transition-colors cursor-pointer border-b border-border"
      onClick={handleTweetClick}
    >
      <div className="flex space-x-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={tweet.authorImage || undefined} alt={`${tweet.authorName} avatar`} />
          <AvatarFallback>
            {tweet.authorName?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-foreground hover:underline">{tweet.authorName}</h3>
            {tweet.authorUsername && (
              <span className="text-muted-foreground">@{tweet.authorUsername}</span>
            )}
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{formatTimeAgo(tweet.createdAt)}</span>
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="rounded-full">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isAuthor && (
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      className="text-red-600 focus:text-red-600"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {deleteMutation.isPending ? 'Deleting...' : 'Delete tweet'}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="mt-1">
            <p className="text-foreground whitespace-pre-wrap">{tweet.content}</p>
          </div>

          <div className="flex items-center justify-between max-w-md mt-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-2 text-muted-foreground hover:text-primary rounded-full"
              onClick={handleReply}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{tweet.repliesCount}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className={`flex items-center space-x-2 rounded-full ${
                tweet.isRetweetedByUser 
                  ? 'text-green-600' 
                  : 'text-muted-foreground hover:text-green-600'
              }`}
              onClick={handleRetweet}
              disabled={retweetMutation.isPending}
            >
              <Repeat2 className="w-4 h-4" />
              <span className="text-sm">{tweet.retweetsCount}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className={`flex items-center space-x-2 rounded-full ${
                tweet.isLikedByUser 
                  ? 'text-red-500' 
                  : 'text-muted-foreground hover:text-red-500'
              }`}
              onClick={handleLike}
              disabled={likeMutation.isPending}
            >
              <Heart className={`w-4 h-4 ${tweet.isLikedByUser ? 'fill-current' : ''}`} />
              <span className="text-sm">{tweet.likesCount}</span>
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