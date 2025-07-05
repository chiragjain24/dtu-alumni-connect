import { TweetReplyCard } from '../tweets/tweet-reply-card';
import { useUserRepliesInfinite } from '@/lib/queries/users';
import Loader from '@/components/loader';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Trash2 } from 'lucide-react';

interface UserRepliesTimelineProps {
  userId: string;
  isMyProfile: boolean;
  username: string;
}

export function UserRepliesTimeline({ userId, isMyProfile, username }: UserRepliesTimelineProps) {
  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useUserRepliesInfinite(userId);
  
  const parentRef = useRef<HTMLDivElement>(null);

  // Flatten all replies from all pages
  const allReplies = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page: any) => page.tweets);
  }, [data]);

  // Load more when we reach near the end
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Create virtualizer
  const virtualizer = useWindowVirtualizer({
    count: hasNextPage ? allReplies.length + 1 : allReplies.length,
    estimateSize: () => 300, // Estimated reply height (larger due to parent tweet)
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
      lastItem.index >= allReplies.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      loadMore();
    }
  }, [items, allReplies.length, hasNextPage, isFetchingNextPage, loadMore]);

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
        Failed to load replies. Please try again.
      </div>
    );
  }

  // Empty state
  if (allReplies.length === 0 && !isLoading) {
    return (
      <Card className="shadow-none border-none">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">No replies yet</h3>
              <p className="text-muted-foreground">
                {isMyProfile ? "When you reply to tweets, they'll show up here." : `@${username} hasn't replied to any tweets yet.`}
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
            const isLoaderRow = virtualItem.index > allReplies.length - 1;
            const replyData = allReplies[virtualItem.index];

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
                  <div key={replyData.tweet.id} className="border-b-2 border-border">
                    {/* Parent Tweet */}
                    {replyData.parentTweets.length > 0 ? (
                      <TweetReplyCard 
                        tweet={replyData.parentTweets[0]}
                        showConnector={false}
                        isLast={false}
                      />
                    ) : (
                      <div className="px-4 py-3 relative">
                        {/* Threading line continuation to below */}
                        <div className="absolute left-9 w-0.5 bg-border" style={{ top: '45px', height: 'calc(100% - 45px)' }}></div>
                        
                        <div className="flex space-x-3">
                          <div className="w-9 h-9 bg-muted/50 rounded-full flex items-center justify-center border border-border">
                            <Trash2 className="w-4 h-4 text-muted-foreground/70" />
                          </div>
                          <div className="flex-1 flex items-center">
                            <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border/50">
                              <p className="text-muted-foreground text-sm">This tweet has been deleted</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Reply Tweet */}
                    <TweetReplyCard 
                      tweet={replyData.tweet}
                      showConnector={true}
                      isLast={true}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 