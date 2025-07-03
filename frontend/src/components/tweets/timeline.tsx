import { TweetCard } from './tweet-card';
import { TweetComposer } from './tweet-composer';
import { useTimeline, useCreateTweet } from '@/lib/queries/tweets';
import { useSession } from '@/lib/auth-client';
import Loader from '@/components/loader';
import type { MediaItem, Tweet } from '@/types/types';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useMemo, useRef, useEffect } from 'react';

export function Timeline() {
  const { data: session } = useSession();
  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useTimeline();
  const createTweetMutation = useCreateTweet();
  
  const parentRef = useRef<HTMLDivElement>(null);

  // Flatten all tweets from all pages
  const allTweets = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page: any) => page.tweets as Tweet[]);
  }, [data]);

  const handleCreateTweet = async (content: string, mediaItems: MediaItem[]) => {
    await createTweetMutation.mutateAsync({ content, mediaItems });
  };

  // Load more when we reach near the end
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Create virtualizer
  const virtualizer = useWindowVirtualizer({
    count: hasNextPage ? allTweets.length + 1 : allTweets.length,
    estimateSize: () => 200, // Estimated tweet height
    overscan: 5,
  });

  // Get virtual items
  const items = virtualizer.getVirtualItems();

  // Load more when scrolling near the end
  useEffect(() => {
    const [lastItem] = [...items].reverse();
    
    if (!lastItem) return;
    
    // More conservative loading - only load when we're at the very last item
    if (
      lastItem.index >= allTweets.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      loadMore();
    }
  }, [items, allTweets.length, hasNextPage, isFetchingNextPage, loadMore]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Failed to load timeline. Please try again.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Tweet Composer */}
      {session?.user && (
        <TweetComposer
          user={{
            name: session.user.name,
            username: session.user.username || '',
            image: session.user.image || '',
          }}
          onTweet={handleCreateTweet}
          disabled={createTweetMutation.isPending}
        />
      )}

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
            const isLoaderRow = virtualItem.index > allTweets.length - 1;
            const tweet = allTweets[virtualItem.index];

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
                      <p>You've reached the end of your timeline!</p>
                    </div>
                  )
                ) : (
                  <TweetCard
                    key={tweet.id}
                    tweet={tweet}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Empty state for when there are no tweets */}
        {allTweets.length === 0 && !isLoading && (
          <div className="p-8 text-center text-muted-foreground">
            <h3 className="text-lg font-semibold mb-2">Welcome to DTU Alumni Connect!</h3>
            <p>Be the first to share what's happening in your network.</p>
          </div>
        )}
      </div>
    </div>
  );
} 