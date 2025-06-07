import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TweetCard } from '@/components/tweets/tweet-card'
import { TweetDetailCard } from '@/components/tweets/tweet-detail-card'
import { TweetThreadCard } from '@/components/tweets/tweet-thread-card'
import { TweetComposer } from '@/components/tweets/tweet-composer'
import { useTweet, useCreateTweet } from '@/lib/queries/tweets'
import { useSession } from '@/lib/auth-client'
import Loader from '@/components/loader'

export default function TweetDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: session } = useSession()
  const { data, isLoading, error } = useTweet(id!)
  const createTweetMutation = useCreateTweet()
  const replyComposerRef = useRef<HTMLDivElement>(null)

  const handleCreateReply = async (content: string, mediaUrls: string[]) => {
    if (!id) return
    await createTweetMutation.mutateAsync({ 
      content, 
      mediaUrls,
      parentTweetId: id
    })
  }

  const handleReplyClick = () => {
    replyComposerRef.current?.querySelector('textarea')?.focus();
  }

  // Scroll to top when tweet changes
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="rounded-full p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Tweet</h1>
          </div>
        </div>
        <div className="flex justify-center items-center py-8">
          <Loader />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen">
        <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="rounded-full p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Tweet</h1>
          </div>
        </div>
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Tweet not found</h2>
          <p className="text-muted-foreground mb-4">This tweet may have been deleted or doesn't exist.</p>
          <Button onClick={() => navigate('/')}>Go to Home</Button>
        </div>
      </div>
    )
  }

  const { tweet, parentTweets, replies } = data

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 z-10">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="rounded-full p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Tweet</h1>
        </div>
      </div>

      {/* Parent Tweets (Thread Context) */}
      {parentTweets.length > 0 && (
        <div>
          {parentTweets.map((parentTweet, index) => (
            <TweetThreadCard 
              key={parentTweet.id} 
              tweet={parentTweet}
              isLast={index === parentTweets.length - 1}
            />
          ))}
        </div>
      )}

      {/* Main Tweet */}
      <div className="border-b border-border">
        <TweetDetailCard 
          tweet={tweet}
          onReply={handleReplyClick}
        />
      </div>

      {/* Reply Composer */}
      {session?.user && (
        <div ref={replyComposerRef} className="border-b border-border">
          <TweetComposer 
            user={{
              name: session.user.name,
              username: session.user.username || '',
              image: session.user.image || '',
            }}
            placeholder={`Reply to ${tweet.authorName}...`}
            parentTweetId={tweet.id}
            onTweet={handleCreateReply}
            disabled={createTweetMutation.isPending}
          />
        </div>
      )}

      {/* Replies */}
      <div>
        {replies.length > 0 ? (
          <div>
            {replies.map((reply) => (
              <TweetCard 
                key={reply.id} 
                tweet={reply}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No replies yet. Be the first to reply!</p>
          </div>
        )}
      </div>
    </div>
  )
} 