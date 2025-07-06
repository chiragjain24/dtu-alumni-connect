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
      // Update the notifications cache
      queryClient.setQueryData(['notifications'], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            notifications: page.notifications.map((notification: Notification) => ({
              ...notification,
              isRead: true,
            })),
          })),
        };
      });

      // Update unread count to 0
      queryClient.setQueryData(['notifications', 'unread-count'], () => ({
        count: 0,
      }));
    },
    onError: (error) => {
      console.error('Error marking all notifications as read:', error);
    },
  });
} 