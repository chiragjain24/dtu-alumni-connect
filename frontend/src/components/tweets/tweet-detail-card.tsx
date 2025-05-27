import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Heart, MessageCircle, Repeat2, Share, Trash2 } from 'lucide-react'
import type { Tweet } from '@/types/types'
import { useLikeTweet, useRetweetTweet, useDeleteTweet } from '@/lib/queries/tweets'
import { useSession } from '@/lib/auth-client'
import { useNavigate } from 'react-router-dom'

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
    onReply?.()
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this tweet?')) {
      await deleteMutation.mutateAsync(tweet.id)
      // Navigate back to home after deleting the tweet
      navigate('/')
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

  return (
    <div className="p-4 pb-0">
      <div className="flex space-x-3 mb-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={tweet.authorImage || undefined} alt={`${tweet.authorName} avatar`} />
          <AvatarFallback>
            {tweet.authorName?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <div className="">
              <h3 className="font-bold text-foreground hover:underline">{tweet.authorName}</h3>
              <span className="text-muted-foreground">@{tweet.authorUsername}</span>
            </div>

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
        </div>
      </div>
      
      {/* Tweet Content - Larger text for detail view */}
      <div className="mb-4">
        <p className="text-foreground text-xl leading-relaxed whitespace-pre-wrap">{tweet.content}</p>
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
            onClick={handleReply}
          >
            <MessageCircle className="w-5 h-5" />
            {tweet.repliesCount > 0 && (
              <span className="text-muted-foreground text-sm">
                {tweet.repliesCount}
              </span>
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex items-center space-x-2 rounded-full p-3 ${
              tweet.isRetweetedByUser 
                ? 'text-green-600' 
                : 'text-muted-foreground hover:text-green-600'
              }`}
              onClick={handleRetweet}
              disabled={retweetMutation.isPending}
              >
            <Repeat2 className="w-5 h-5" />
            {tweet.retweetsCount > 0 && (
              <span className="text-muted-foreground text-sm">
                {tweet.retweetsCount}
              </span>
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex items-center space-x-2 rounded-full p-3 ${
              tweet.isLikedByUser 
              ? 'text-red-500' 
              : 'text-muted-foreground hover:text-red-500'
            }`}
            onClick={handleLike}
            disabled={likeMutation.isPending}
            >
            <Heart className={`w-5 h-5 ${tweet.isLikedByUser ? 'fill-current' : ''}`} />
            {tweet.likesCount > 0 && (
              <span className="text-muted-foreground text-sm">
                {tweet.likesCount}
              </span>
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center space-x-2 text-muted-foreground hover:text-primary rounded-full p-3"
            >
            <Share className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
} 