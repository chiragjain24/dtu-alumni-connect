import { TweetCard } from '../tweets/tweet-card';
import { useUserLikedTweetsInfinite } from '@/lib/queries/users';
import Loader from '@/components/loader';
import type { Tweet } from '@/types/types';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface UserLikesTimelineProps {
  userId: string;
  isMyProfile: boolean;
  username: string;
}

export function UserLikesTimeline({ userId, isMyProfile, username }: UserLikesTimelineProps) {
  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useUserLikedTweetsInfinite(userId);
  
  const parentRef = useRef<HTMLDivElement>(null);

  // Flatten all tweets from all pages
  const allTweets = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page: any) => page.tweets as Tweet[]);
  }, [data]);

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
        Failed to load liked tweets. Please try again.
      </div>
    );
  }

  // Empty state
  if (allTweets.length === 0 && !isLoading) {
    return (
      <Card className="shadow-none border-none">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">No likes yet</h3>
              <p className="text-muted-foreground">
                {isMyProfile ? "When you like tweets, they'll show up here." : `@${username} hasn't liked any tweets yet.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
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
                      <p>You've reached the end!</p>
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
      </div>
    </div>
  );
} 