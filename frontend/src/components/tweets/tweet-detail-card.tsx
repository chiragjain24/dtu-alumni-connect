import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { MoreHorizontal, Heart, MessageCircle, Repeat2, Share } from 'lucide-react'
import type { Tweet } from '@/types/types'
import { useLikeTweet, useRetweetTweet } from '@/lib/queries/tweets'

interface TweetDetailCardProps {
  tweet: Tweet
  onReply?: () => void
}

export function TweetDetailCard({ 
  tweet,
  onReply
}: TweetDetailCardProps) {
  const likeMutation = useLikeTweet()
  const retweetMutation = useRetweetTweet()

  const handleLike = async () => {
    await likeMutation.mutateAsync({tweet, isLike: !tweet.isLikedByUser})
  }

  const handleRetweet = async () => {
    await retweetMutation.mutateAsync(tweet)
  }

  const handleReply = () => {
    onReply?.()
  };
  
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
    <div className="p-4 pb-2">
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
              <Button variant="ghost" size="sm" className="rounded-full">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
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
      <div className="flex items-center justify-between max-w-md pb-4 border-b border-border">
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
  )
} 