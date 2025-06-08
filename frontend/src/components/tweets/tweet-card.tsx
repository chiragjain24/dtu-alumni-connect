import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Heart, MessageCircle, Repeat2, Share2, Copy, ExternalLink, Flag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Tweet } from '@/types/types'
import { useLikeTweet, useRetweetTweet } from '@/lib/queries/tweets'
import { useSession } from '@/lib/auth-client'
import { toast } from 'sonner'
import { TweetMedia } from './tweet-media'
import { DeleteTweetDialog } from './delete-tweet-dialog'
import { Link } from 'react-router-dom'

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

  const handleShare = async (shareType: 'copy' | 'native') => {
    const tweetUrl = `${window.location.origin}/tweet/${tweet.id}`
    const shareText = `Check out this tweet: "${tweet.content.slice(0, 100)}${tweet.content.length > 100 ? '...' : ''}"`
    
    try {
      switch (shareType) {
        case 'copy':
          await navigator.clipboard.writeText(tweetUrl)
          toast.success('Tweet link copied to clipboard!')
          break
            
        case 'native':
          if ('share' in navigator && typeof navigator.share === 'function') {
            await navigator.share({
              title: 'DTU Alumni Connect',
              text: shareText,
              url: tweetUrl,
            })
          } else {
            // Fallback to copy
            await navigator.clipboard.writeText(tweetUrl)
            toast.success('Tweet link copied to clipboard!')
          }
          break
      }
    } catch (error) {
      console.error('Share error:', error)
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

  // Centralized click handler that determines action based on data attributes
  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const clickableElement = target.closest('[data-action]') as HTMLElement
    if (!clickableElement) {
      // No specific action found, navigate to tweet detail
      navigate(`/tweet/${tweet.id}`)
      return
    }

    const action = clickableElement.getAttribute('data-action')
    
    switch (action) {
      case 'like':
        handleLike()
        break
      case 'retweet':
        handleRetweet()
        break
      case 'reply':
        handleReply()
        break
      case 'share-copy':
        handleShare('copy')
        break
      case 'share-native':
        handleShare('native')
        break
      case 'prevent':
        // Do nothing - prevents default tweet navigation
        break
    }
  }

  return (
    <div 
      className="px-4 pb-1 pt-3 hover:bg-accent/50 transition-colors border-b border-border"
      onClick={handleContainerClick}
    >
      <div className="flex space-x-3">
        <Link to={`/profile/${tweet.authorUsername}`} data-action="prevent">
          <Avatar 
            className="w-10 h-10 hover:opacity-80 transition-opacity" 
            >
            <AvatarImage src={tweet.authorImage || undefined} alt={`${tweet.authorName} avatar`} />
            <AvatarFallback>
              {tweet.authorName?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <Link to={`/profile/${tweet.authorUsername}`} data-action="prevent">
              <h3 className="font-bold text-foreground hover:underline" >
                {tweet.authorName}
              </h3>
            </Link>
            <Link to={`/profile/${tweet.authorUsername}`} data-action="prevent">
              {tweet.authorUsername && (
                <span className="text-muted-foreground" >
                  @{tweet.authorUsername}
                </span>
              )}
            </Link>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{formatTimeAgo(tweet.createdAt)}</span>
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-full"
                    data-action="prevent"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" data-action="prevent">
                  {isAuthor && (
                    <DeleteTweetDialog tweet={tweet} />
                  )}
                  <DropdownMenuItem>
                    <Flag className="w-4 h-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="mt-1">
            <p className="text-foreground whitespace-pre-wrap">{tweet.content}</p>
            <TweetMedia mediaItems={tweet.mediaItems || []} />
          </div>

          <div className="flex items-center justify-between max-w-md mt-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-2 text-muted-foreground hover:text-primary rounded-full"
              data-action="reply"
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
              data-action="retweet"
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
              data-action="like"
              disabled={likeMutation.isPending}
            >
              <Heart className={`w-4 h-4 ${tweet.isLikedByUser ? 'fill-current' : ''}`} />
              <span className="text-sm">{tweet.likesCount}</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center space-x-2 text-muted-foreground hover:text-primary rounded-full"
                  data-action="prevent"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" data-action="prevent">
                <DropdownMenuItem data-action="share-copy">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy link
                </DropdownMenuItem>
                {'share' in navigator && typeof navigator.share === 'function' && (
                  <DropdownMenuItem data-action="share-native">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Share via...
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
} 