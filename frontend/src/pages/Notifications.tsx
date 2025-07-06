import { BackButton } from '@/components/others/back-button';
import { NotificationsTimeline } from '@/components/notifications/notifications-timeline';
import { useMarkAllNotificationsAsRead, useUnreadNotificationsCount } from '@/lib/queries/notifications';
import { useEffect } from 'react';

export default function Notifications() {
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const { data: unreadCount } = useUnreadNotificationsCount();

  useEffect(() => {
    if (unreadCount && unreadCount.count > 0) {
      markAllAsRead.mutate();
    }
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-xl font-bold text-foreground">Notifications</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pb-20 sm:pb-4">
        <NotificationsTimeline />
      </div>
    </div>
  );
} 