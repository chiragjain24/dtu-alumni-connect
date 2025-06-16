import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ProfileHoverCard } from '@/components/ui/profile-hover-card'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Heart, MessageCircle, Repeat2, Share2, Copy, ExternalLink, Flag } from 'lucide-react'
import type { Tweet } from '@/types/types'
import { useLikeTweet, useRetweetTweet } from '@/lib/queries/tweets'
import { useSession } from '@/lib/auth-client'
import { useNavigate, Link } from 'react-router-dom'
import { TweetMedia } from './tweet-media'
import { toast } from 'sonner'
import { DeleteTweetDialog } from './delete-tweet-dialog'

interface TweetDetailCardProps {
  tweet: Tweet
  onReply?: () => void
}

export function TweetDetailCard({ 
  tweet,
  onReply
}: TweetDetailCardProps) {
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
    onReply?.()
  };

  const handleDeleteSuccess = () => {
    // Navigate back to home after deleting the tweet
    navigate('/')
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
  
  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Centralized click handler that determines action based on data attributes
  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const clickableElement = target.closest('[data-action]') as HTMLElement
    
    if (!clickableElement) {
      return // No default action for detail card
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
        // Do nothing - prevents any unwanted actions
        break
    }
  }

  return (
    <div className="p-4 pb-0" onClick={handleContainerClick}>
      <div className="flex space-x-3 mb-3">
        <div className="">
          <ProfileHoverCard username={tweet.authorUsername || ''}>
            <Avatar className="w-9 h-9 hover:opacity-80 transition-opacity" data-action="prevent"
              onClick={() => navigate(`/profile/${tweet.authorUsername}`)}
            >
              <AvatarImage src={tweet.authorImage || undefined} alt={`${tweet.authorName} avatar`} />
              <AvatarFallback>
                {tweet.authorName?.split(' ')[0][0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </ProfileHoverCard>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <div className="">
              <Link to={`/profile/${tweet.authorUsername}`} data-action="prevent">
                <h3 className="font-bold text-foreground hover:underline">{tweet.authorName}</h3>
              </Link>
              <span className="text-muted-foreground">@{tweet.authorUsername}</span>
            </div>

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
                    <DeleteTweetDialog tweet={tweet} onDeleteSuccess={handleDeleteSuccess} />
                  )}
                  <DropdownMenuItem>
                    <Flag className="w-4 h-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tweet Content - Larger text for detail view */}
      <div className="mb-4">
        <p className="text-foreground text-lg leading-relaxed whitespace-pre-wrap">{tweet.content}</p>
        <TweetMedia mediaItems={tweet.mediaItems || []} />
      </div>

      {/* Timestamp */}
      <div className="mb-2 pb-4 border-b border-border">
        <span className="text-muted-foreground text-sm">{formatFullDate(tweet.createdAt)}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex">
        <div className={"w-10"}/>
        <div className="flex-1 flex items-center justify-between max-w-md pb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center space-x-2 text-muted-foreground hover:text-primary rounded-full p-3"
            data-action="reply"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-muted-foreground text-sm">
              {tweet.repliesCount}
            </span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex items-center space-x-2 rounded-full p-3 ${
              tweet.isRetweetedByUser 
                ? 'text-green-600' 
                : 'text-muted-foreground hover:text-green-600'
            }`}
            data-action="retweet"
            disabled={retweetMutation.isPending}
          >
            <Repeat2 className="w-5 h-5" />
            <span className="text-muted-foreground text-sm">
              {tweet.retweetsCount}
            </span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex items-center space-x-2 rounded-full p-3 ${
              tweet.isLikedByUser 
              ? 'text-red-500' 
              : 'text-muted-foreground hover:text-red-500'
            }`}
            data-action="like"
            disabled={likeMutation.isPending}
          >
            <Heart className={`w-5 h-5 ${tweet.isLikedByUser ? 'fill-current' : ''}`} />
            <span className="text-muted-foreground text-sm">
              {tweet.likesCount}
            </span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary rounded-full p-3"
                data-action="prevent"
              >
                <Share2 className="w-5 h-5" />
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
  )
} 