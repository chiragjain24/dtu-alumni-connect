import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/utils';

export interface CreateTweetData {
  content: string;
  parentTweetId?: string;
}

// Timeline tweets query
export function useTimeline() {
  return useQuery({
    queryKey: ['tweets', 'timeline'],
    queryFn: async () => {
      const response = await api.tweets.$get();
      if (!response.ok) {
        throw new Error('Failed to fetch timeline');
      }
      const data = await response.json();
      return data.tweets;
    },
    refetchOnWindowFocus: false,
    refetchInterval: 30000, // 30 seconds
    staleTime: 10000, // 10 seconds
  });
}

// Single tweet query
export function useTweet(id: string) {
  return useQuery({
    queryKey: ['tweets', id],
    queryFn: async () => {
      const response = await api.tweets[':id'].$get({ param: { id } });
      if (!response.ok) {
        throw new Error('Failed to fetch tweet');
      }
      const data = await response.json();
      return {
        tweet: data.tweet,
        replies: data.replies,
      };
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
    refetchInterval: 30000, // 30 seconds
    staleTime: 10000, // 10 seconds
  });
}

// User tweets query
export function useUserTweets(userId: string) {
  return useQuery({
    queryKey: ['tweets', 'user', userId],
    queryFn: async () => {
      const response = await api.tweets.user[':id'].$get({ param: { id: userId } });
      if (!response.ok) {
        throw new Error('Failed to fetch user tweets');
      }
      const data = await response.json();
      return data.tweets;
    },
    enabled: !!userId,
    refetchOnWindowFocus: false,
  });
}


// Create tweet mutation
export function useCreateTweet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTweetData) => {
      const response = await api.tweets.$post({ json: data });
      if (!response.ok) {
        throw new Error('Failed to create tweet');
      }
      const result = await response.json();
      return result.tweet;
    },
    onSuccess: (newTweet) => {
      // Invalidate and refetch timeline
      queryClient.invalidateQueries({ queryKey: ['tweets', 'timeline'] });
      
      // If it's a reply, invalidate the parent tweet
      if (newTweet.parentTweetId) {
        queryClient.invalidateQueries({ queryKey: ['tweets', newTweet.parentTweetId] });
      }
      
      // Invalidate user tweets
      queryClient.invalidateQueries({ queryKey: ['tweets', 'user', newTweet.authorId] });
    },
  });
}

// Delete tweet mutation
export function useDeleteTweet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tweetId: string) => {
      const response = await api.tweets[':id'].$delete({ param: { id: tweetId } });
      if (!response.ok) {
        throw new Error('Failed to delete tweet');
      }
      return await response.json();
    },
    onSuccess: (_, tweetId) => {
      queryClient.invalidateQueries({ queryKey: ['tweets', 'timeline'] });
      queryClient.invalidateQueries({ queryKey: ['tweets', tweetId] });

      // // Invalidate all tweet-related queries
      // queryClient.invalidateQueries({ queryKey: ['tweets'] });
    },
  });
} 