import { useBookmarkedTweetsInfinite } from '@/lib/queries/tweets'
import { TweetCard } from '@/components/tweets/tweet-card'
import Loader from '@/components/loader'
import { Bookmark } from 'lucide-react'
import type { Tweet } from '@/types/types'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { useCallback, useMemo, useRef, useEffect } from 'react'

export default function Bookmarks() {
  
  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useBookmarkedTweetsInfinite()
  
  const parentRef = useRef<HTMLDivElement>(null)

  // Flatten all tweets from all pages
  const allTweets = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap((page: any) => page.tweets as Tweet[])
  }, [data])

  // Load more when we reach near the end
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Create virtualizer
  const virtualizer = useWindowVirtualizer({
    count: hasNextPage ? allTweets.length + 1 : allTweets.length,
    estimateSize: () => 200, // Estimated tweet height
    overscan: 5,
  })

  // Get virtual items
  const items = virtualizer.getVirtualItems()

  // Load more when scrolling near the end
  useEffect(() => {
    const [lastItem] = [...items].reverse()
    
    if (!lastItem) return
    
    // More conservative loading - only load when we're at the very last item
    if (
      lastItem.index >= allTweets.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      loadMore()
    }
  }, [items, allTweets.length, hasNextPage, isFetchingNextPage, loadMore])

  if (isLoading) {
    return (
      <div className="">
        <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 z-10 flex items-center gap-4">
          <div className="h-[2rem] flex flex-col justify-center">
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
        <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 z-10 flex items-center gap-4">
          <div className="h-[2rem] flex flex-col justify-center">
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
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 z-10 flex items-center gap-4">
        <div className="h-[2rem] flex flex-col justify-center">
          <h1 className="text-xl font-bold text-foreground">Bookmarks</h1>
        </div>
      </div>

      {/* Virtual Timeline */}
      <div ref={parentRef}>
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: '100%',
            position: 'relative',
          }}
        >
          {items.map((virtualItem) => {
            const isLoaderRow = virtualItem.index > allTweets.length - 1
            const tweet = allTweets[virtualItem.index]

            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={(node) => virtualizer.measureElement(node)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {isLoaderRow ? (
                  hasNextPage ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader />
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <p>You've reached the end of your bookmarks!</p>
                    </div>
                  )
                ) : (
                  <div className="hover:bg-muted/30 transition-colors border-b border-border">
                    <TweetCard key={tweet.id} tweet={tweet} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Empty state for when there are no bookmarks */}
        {allTweets.length === 0 && !isLoading && (
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
        )}
      </div>
    </div>
  )
} 