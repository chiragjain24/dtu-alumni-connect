import { useBookmarkedTweets } from '@/lib/queries/tweets'
import { TweetCard } from '@/components/tweets/tweet-card'
import Loader from '@/components/loader'
import { Bookmark } from 'lucide-react'

export default function Bookmarks() {
  const { data: bookmarkedTweets, isLoading, error } = useBookmarkedTweets()

  if (isLoading) {
    return (
      <div className="">
        <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-foreground">Bookmarks</h1>
          </div>
        </div>
        <div className="flex justify-center items-center py-20">
          <Loader />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-foreground">Bookmarks</h1>
          </div>
        </div>
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Something went wrong</h2>
          <p className="text-muted-foreground">Failed to load your bookmarked tweets. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Bookmarks</h1>
            <p className="text-sm text-muted-foreground">
              {bookmarkedTweets?.length === 0 
                ? 'No bookmarks yet'
                : `${bookmarkedTweets?.length} ${bookmarkedTweets?.length === 1 ? 'bookmark' : 'bookmarks'}`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="divide-y divide-border">
        {bookmarkedTweets?.length === 0 ? (
          <div className="p-6 text-center">
            <div className="flex flex-col items-center space-y-4 py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Bookmark className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Save tweets for later</h2>
                <p className="text-muted-foreground max-w-md">
                  Don't let the good ones fly away! Bookmark tweets to easily find them again in the future.
                </p>
              </div>
            </div>
          </div>
        ) : (
          bookmarkedTweets?.map((tweet) => (
            <div key={tweet.id} className="hover:bg-muted/30 transition-colors">
              <TweetCard tweet={tweet} />
            </div>
          ))
        )}
      </div>
    </div>
  )
} 