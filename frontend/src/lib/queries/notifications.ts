import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/utils';

// Fetch notifications with infinite scroll
export function useNotificationsInfinite() {
  return useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {

      const response = await api.notifications.$get({ 
        query: { limit: '50', cursor: pageParam }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      return response.json();
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Fetch unread notifications count
export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await api.notifications['unread-count'].$get();
      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }
      return response.json();
    },
    staleTime: 1000 * 30, // 30 seconds,
    refetchOnWindowFocus: false,
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}

// Mark individual notification as read (optimistic update only)
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      // No backend call - this is purely optimistic
      return { id: notificationId };
    },
    onMutate: async (notificationId: string) => {
      // Check if queries are already in progress
      const notificationsState = queryClient.getQueryState(['notifications']);
      if (notificationsState?.fetchStatus === 'fetching') {
        return;
      }

      const previousNotifications = queryClient.getQueryData(['notifications']);
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old) return old;
        
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            notifications: page.notifications.map((notification: any) => 
              notification.id === notificationId 
                ? { ...notification, isRead: true }
                : notification
            )
          }))
        };
      });

      return { previousNotifications };
    },
    onError: (_, __, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
      }
    },
  });
}

// Mark all notifications as read
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.notifications['read-all'].$patch();
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(['notifications', 'unread-count'], () => ({
        count: 0,
      }));
    },
    onError: (error) => {
      console.error('Error marking all notifications as read:', error);
    },
  });
} 