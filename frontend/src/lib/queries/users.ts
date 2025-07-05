import { api } from '../utils'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

export const useGetUserProfile = (username: string, enabled: boolean = true) => {
  const { data, isPending, error } = useQuery({
    queryKey: ['user-profile', username],
    queryFn: async () => {
      const res = await api.users[':username'].$get({
        param: { username }
      })
      if (!res.ok) {
        throw new Error('Failed to fetch user profile', { cause: res.status })
      }
      return res.json()
    },
    enabled: !!username && enabled,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      if (error instanceof Error && error.cause === 404) {
        return false
      }
      return failureCount < 3
    }
  })

  return { data, isPending, error }
}

// User tweets infinite query
export function useUserTweetsInfinite(userId: string) {
  return useInfiniteQuery({
    queryKey: ['tweets', 'user', userId],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const response = await api.users[':id'].tweets.$get({
        param: { id: userId },
        query: { limit: '40', cursor: pageParam }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user tweets');
      }
      
      return await response.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
    enabled: !!userId,
    refetchOnWindowFocus: false,
    refetchInterval: 300000, // 5 minutes
    staleTime: 10000, // 10 seconds
  });
}

// User liked tweets infinite query
export function useUserLikedTweetsInfinite(userId: string) {
  return useInfiniteQuery({
    queryKey: ['tweets', 'user', 'likes', userId],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const response = await api.users[':id'].likes.$get({
        param: { id: userId },
        query: { limit: '40', cursor: pageParam }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user liked tweets');
      }
      
      return await response.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
    enabled: !!userId,
    refetchOnWindowFocus: false,
    refetchInterval: 300000, // 5 minutes
    staleTime: 10000, // 10 seconds
  });
}

// User replies infinite query
export function useUserRepliesInfinite(userId: string) {
  return useInfiniteQuery({
    queryKey: ['tweets', 'user', 'replies', userId],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const response = await api.users[':id'].replies.$get({
        param: { id: userId },
        query: { limit: '40', cursor: pageParam }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user replies');
      }
      
      return await response.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
    enabled: !!userId,
    refetchOnWindowFocus: false,
    refetchInterval: 300000, // 5 minutes
    staleTime: 10000, // 10 seconds
  });
}
