import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/utils';
import type { Tweet } from '@/types/types';

export interface CreateTweetData {
  content: string;
  parentTweetId?: string;
}

// Cache update utilities
function createTweetUpdater(tweetId: string, updater: (tweet: Tweet) => Tweet) {
  return (data: any): any => {
    if (!data) return data;
    
    // For timeline (array of tweets)
    if (Array.isArray(data)) {
      return data.map((t: Tweet) => 
        t.id === tweetId ? updater(t) : t
      );
    }
    
    // For single tweet
    if (data.id === tweetId) {
      return updater(data);
    }

    // For tweet detail page (has tweet + replies structure)
    if (data.tweet && data.replies) {
      return {
        ...data,
        tweet: data.tweet.id === tweetId ? updater(data.tweet) : data.tweet,
        replies: data.replies.map((reply: Tweet) => 
          reply.id === tweetId ? updater(reply) : reply
        )
      };
    }

    return data;
  };
}

function updateTweetInteraction(
  queryClient: any, 
  tweet: Tweet, 
  type: 'like' | 'retweet', 
  newState: boolean
) {
  const updater = createTweetUpdater(tweet.id, (t: Tweet) => {
    if (type === 'like') {
      return {
        ...t,
        isLikedByUser: newState,
        likesCount: newState ? t.likesCount + 1 : Math.max(0, t.likesCount - 1)
      };
    } else {
      return {
        ...t,
        isRetweetedByUser: newState,
        retweetsCount: newState ? t.retweetsCount + 1 : Math.max(0, t.retweetsCount - 1)
      };
    }
  });

  // Get all potentially affected cache entries
  const cacheKeys = [
    ['tweets', 'timeline'],
    ['tweets', tweet.id],
    ['tweets', 'user', tweet.authorId],
    ...(tweet.parentTweetId ? [['tweets', tweet.parentTweetId]] : [])
  ];

  const previousData: Record<string, any> = {};

  // Update all cache entries
  cacheKeys.forEach(key => {
    const keyString = key.join('-');
    const currentData = queryClient.getQueryData(key);
    if (currentData) {
      // Store in previousData so that it can be used in rollback
      previousData[keyString] = currentData;
      queryClient.setQueryData(key, updater(currentData));
    }
  });

  return { previousData, cacheKeys, tweet };
}

function rollbackTweetInteraction(
  queryClient: any, 
  context: { previousData: Record<string, any>, cacheKeys: any[][], tweet: Tweet }
) {
  context.cacheKeys.forEach(key => {
    const keyString = key.join('-');
    if (context.previousData[keyString]) {
      queryClient.setQueryData(key, context.previousData[keyString]);
    }
  });
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

// Like/unlike tweet mutation
export function useLikeTweet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({tweet, isLike}: {tweet: Tweet, isLike: boolean}) => {
      const response = await api.tweets[':id'].like.$post({ 
        param: { id: tweet.id },
        json: { isLike: isLike }
      });
      if (!response.ok) {
        throw new Error('Failed to toggle like');
      }
      return await response.json();
    },
    onMutate: async ({tweet, isLike}) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tweets'] });
      
      // Optimistically update cache
      return updateTweetInteraction(queryClient, tweet, 'like', isLike);
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context) {
        rollbackTweetInteraction(queryClient, context);
      }
    }
    // No onSuccess or onSettled - optimistic updates are sufficient
    // The server response confirms success but we don't need to sync
  });
}

// Retweet/unretweet mutation
export function useRetweetTweet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tweet: Tweet) => {
      const response = await api.tweets[':id'].retweet.$post({ param: { id: tweet.id } });
      if (!response.ok) {
        throw new Error('Failed to toggle retweet');
      }
      return await response.json();
    },
    onMutate: async (tweet) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tweets'] });
      
      // Determine new retweet state (toggle current state)
      const isRetweet = !tweet.isRetweetedByUser;
      
      // Optimistically update cache
      return updateTweetInteraction(queryClient, tweet, 'retweet', isRetweet);
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context) {
        rollbackTweetInteraction(queryClient, context);
      }
    }
    // No onSuccess or onSettled - optimistic updates are sufficient
  });
}