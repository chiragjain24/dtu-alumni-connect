import { useCallback, useMemo, useRef, useEffect } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useNotificationsInfinite } from '@/lib/queries/notifications';
import { NotificationItem } from './notification-item';
import Loader from '@/components/loader';

export function NotificationsTimeline() {

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useNotificationsInfinite();

  const parentRef = useRef<HTMLDivElement>(null);

  // Flatten all notifications from all pages
  const allNotifications = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.notifications);
  }, [data]);

  // Load more when we reach near the end
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Create virtualizer
  const virtualizer = useWindowVirtualizer({
    count: hasNextPage ? allNotifications.length + 1 : allNotifications.length,
    estimateSize: () => 80, // Estimated notification height
    overscan: 5,
  });

  // Get virtual items
  const items = virtualizer.getVirtualItems();

  // Load more when scrolling near the end
  useEffect(() => {
    const [lastItem] = [...items].reverse();
    
    if (!lastItem) return;
    
    // Load when we're at the very last item
    if (
      lastItem.index >= allNotifications.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      loadMore();
    }
  }, [items, allNotifications.length, hasNextPage, isFetchingNextPage, loadMore]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-lg font-medium text-foreground mb-2">
          Something went wrong
        </p>
        <p className="text-muted-foreground">
          Failed to load notifications. Please try again later.
        </p>
      </div>
    );
  }

  if (allNotifications.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-5 5v-5z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          No notifications yet
        </h2>
        <p className="text-muted-foreground max-w-sm">
          When someone likes, retweets, or replies to your tweets, you'll see it here.
        </p>
      </div>
    );
  }

  return (
    <div ref={parentRef}>
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {items.map((virtualItem) => {
          const isLoaderRow = virtualItem.index > allNotifications.length - 1;
          const notification = allNotifications[virtualItem.index];

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
                  <div className="text-center py-8 text-muted-foreground">
                    <p>You've seen all your notifications</p>
                  </div>
                )
              ) : (
                <NotificationItem key={notification.id} notification={notification} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 