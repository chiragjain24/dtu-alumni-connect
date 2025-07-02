import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/utils';
import type { Tweet, MediaItem } from '@/types/types';

export interface CreateTweetData {
  content: string;
  mediaItems: MediaItem[];
  parentTweetId?: string;
}

function updateTweetAcrossAllCaches(
  queryClient: any,
  tweetId: string,
  updater: (tweet: Tweet) => Tweet
): { previousData: Record<string, any>, cacheKeys: string[][] } {
  const previousData: Record<string, any> = {};
  const cacheKeys: string[][] = [];
  
  // Get all query cache entries
  const allQueries = queryClient.getQueryCache().getAll();
  
  // Find all tweet-related queries that might contain our tweet
  const tweetQueries = allQueries.filter((query: any) => {
    const queryKey = query.queryKey;
    return queryKey[0] === 'tweets' && query.state.data;
  });

  function updateNestedReplies(replies: Tweet[]): Tweet[] {
    return replies.map(reply => {
        if (reply.id === tweetId) {
          return updater(reply);
        }
        // Handle nested replies recursively
        if (reply.replies && reply.replies.length > 0) {
          return {
            ...reply,
            replies: updateNestedReplies(reply.replies)
          };
        }
        return reply;
    });
  }
  
  tweetQueries.forEach((query: any) => {
    const queryKey = query.queryKey as string[];
    const currentData = query.state.data;
    
    if (!currentData) return;
    
    const keyString = queryKey.join('-');
    previousData[keyString] = currentData;
    cacheKeys.push(queryKey);
    
    let updatedData;
    
    // Handle Array of Tweets
    if (Array.isArray(currentData)) {
      updatedData = currentData.map(tweet => {
          if (tweet.id === tweetId) {
            return updater(tweet);
          }
          // Handle nested replies recursively
          if (tweet.replies && tweet.replies.length > 0) {
            return {
              ...tweet,
              replies: updateNestedReplies(tweet.replies)
            };
          }
          return tweet;
      });

    } 
    // Tweet + parentTweets + replies
    else if(currentData.tweet && currentData.parentTweets && currentData.replies) {
      if(currentData.tweet.id === tweetId) {
        updatedData = {
          ...currentData,
          tweet: updater(currentData.tweet)
        }
      }
      else if(currentData.parentTweets.some((t: Tweet) => t.id === tweetId)) {
        updatedData = {
          ...currentData,
          parentTweets: currentData.parentTweets.map((t: Tweet) => t.id === tweetId ? updater(t) : t)
        }
      }
      else {
        updatedData = {
          ...currentData,
          replies: updateNestedReplies(currentData.replies)
        }
      }
    }
    
    // Only update if data actually changed
    if (updatedData !== currentData) {
      queryClient.setQueryData(queryKey, updatedData);
    }
  
  });
  
  return { previousData, cacheKeys };
}

function rollbackTweetUpdates(
  queryClient: any,
  context: { previousData: Record<string, any>, cacheKeys: string[][] }
) {
  context.cacheKeys.forEach(queryKey => {
    const keyString = queryKey.join('-');
    if (context.previousData[keyString]) {
      queryClient.setQueryData(queryKey, context.previousData[keyString]);
    }
  });
}

function createLikeUpdater(isLiked: boolean) {
  return (tweet: Tweet): Tweet => ({
    ...tweet,
    isLikedByUser: isLiked,
    likesCount: isLiked 
      ? tweet.likesCount + 1 
      : Math.max(0, tweet.likesCount - 1)
  });
}

function createRetweetUpdater(isRetweeted: boolean) {
  return (tweet: Tweet): Tweet => ({
    ...tweet,
    isRetweetedByUser: isRetweeted,
    retweetsCount: isRetweeted 
      ? tweet.retweetsCount + 1 
      : Math.max(0, tweet.retweetsCount - 1)
  });
}

function createBookmarkUpdater(isBookmarked: boolean) {
  return (tweet: Tweet): Tweet => ({
    ...tweet,
    isBookmarkedByUser: isBookmarked,
  });
}

// Timeline tweets query
export function useTimeline() {
  return useQuery({
    queryKey: ['tweets', 'timeline'],
    queryFn: async () => {
      const response = await api.tweets.timeline.$get();
      if (!response.ok) {
        throw new Error('Failed to fetch timeline');
      }
      const data = await response.json();
      return data.tweets;
    },
    refetchOnWindowFocus: false,
    refetchInterval: 300000, // 5 minutes
    staleTime: 30000, // 30 seconds
  });
}

// Single tweet query
export function useTweet(id: string) {
  return useQuery({
    queryKey: ['tweets', id],
    queryFn: async () => {
      const response = await api.tweets.tweet[':id'].$get({ param: { id } });
      if (!response.ok) {
        throw new Error('Failed to fetch tweet', { cause: response.status });
      }
      const data = await response.json();
      return {
        tweet: data.tweet,
        parentTweets: data.parentTweets,
        replies: data.replies,
      };
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
    refetchInterval: 30000, // 30 seconds
    staleTime: 10000, // 10 seconds
    retry: (failureCount, error) => {
      if (error instanceof Error && error.cause === 404) {
        return false
      }
      return failureCount < 3
    }
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
    refetchInterval: 300000, // 5 minutes
    staleTime: 10000, // 10 seconds
  });
}

// User liked tweets query
export function useUserLikedTweets(userId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['tweets', 'user', 'likes', userId],
    queryFn: async () => {
      const response = await api.tweets.user[':id'].likes.$get({ param: { id: userId } });
      if (!response.ok) {
        throw new Error('Failed to fetch user liked tweets');
      }
      const data = await response.json();
      return data.tweets;
    },
    enabled: !!userId && enabled,
    refetchOnWindowFocus: false,
    refetchInterval: 300000, // 5 minutes
    staleTime: 10000, // 10 seconds
  });
}

// Bookmarked tweets query
export function useBookmarkedTweets() {
  return useQuery({
    queryKey: ['tweets', 'bookmarks'],
    queryFn: async () => {
      const response = await api.tweets.bookmarks.$get();
      if (!response.ok) {
        throw new Error('Failed to fetch bookmarked tweets');
      }
      const data = await response.json();
      return data.tweets;
    },
    refetchOnWindowFocus: false,
    refetchInterval: 300000, // 5 minutes
    staleTime: 30000, // 30 seconds
  });
}

// Create tweet mutation
export function useCreateTweet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTweetData) => {
      const response = await api.tweets.create.$post({ json: data });
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
    mutationFn: async (tweet: Tweet) => {
      const response = await api.tweets.tweet[':id'].$delete({ param: { id: tweet.id } });
      if (!response.ok) {
        throw new Error('Failed to delete tweet');
      }
      return await response.json();
    },
    onMutate: async (tweet: Tweet) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tweets'] });
    
      const previousData: Record<string, any> = {};
      const cacheKeys: string[][] = [];
      
      // Get all query cache entries
      const allQueries = queryClient.getQueryCache().getAll();
      
      // Find all tweet-related queries that might contain our tweet
      const tweetQueries = allQueries.filter((query: any) => {
        const queryKey = query.queryKey;
        return queryKey[0] === 'tweets' && query.state.data;
      });
      
      tweetQueries.forEach((query: any) => {
        const queryKey = query.queryKey as string[];
        const currentData = query.state.data;
        
        if (!currentData) return;
        
        const keyString = queryKey.join('-');
        previousData[keyString] = currentData;
        cacheKeys.push(queryKey);
        
        // Handle Array of Tweets
        if (Array.isArray(currentData)) {
          const filteredData = currentData.filter((t: Tweet) => t.id !== tweet.id);
          queryClient.setQueryData(queryKey, filteredData);
        }

        // Handle Tweet + parentTweets + replies
        else if (currentData.tweet && currentData.parentTweets && currentData.replies) {
          // If the main tweet is being deleted
          if (currentData.tweet.id === tweet.id) {
            queryClient.setQueryData(queryKey, null);
          } 
          // Remove from parentTweets
          else if (currentData.parentTweets.some((t: Tweet) => t.id === tweet.id)) {
            queryClient.setQueryData(queryKey, {
              ...currentData,
              parentTweets: currentData.parentTweets.filter((t: Tweet) => t.id !== tweet.id)
            });
          } 
          // Remove from replies recursively
          else {
            const removeFromReplies = (replies: Tweet[]): Tweet[] =>
              replies
                .filter((reply: Tweet) => reply.id !== tweet.id)
                .map((reply: Tweet) => ({
                  ...reply,
                  replies: reply.replies ? removeFromReplies(reply.replies) : []
                }));
            
            queryClient.setQueryData(queryKey, {
              ...currentData,
              replies: removeFromReplies(currentData.replies)
            });
          }
        }
      });

      return { previousData, cacheKeys, tweet };
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context) {
        context.cacheKeys.forEach(key => {
          const keyString = key.join('-');
          if (context.previousData[keyString]) {
            queryClient.setQueryData(key, context.previousData[keyString]);
          }
        });
      }
    },
    onSuccess: (_, tweet) => {
      queryClient.removeQueries({ queryKey: ['tweets', tweet.id] });
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
      return updateTweetAcrossAllCaches(queryClient, tweet.id, createLikeUpdater(isLike));
    },
    onSuccess: (_, {tweet}) => {
      queryClient.invalidateQueries({ queryKey: ['tweets', 'user', 'likes', tweet.authorId] });
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context) {
        rollbackTweetUpdates(queryClient, context);
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
      return updateTweetAcrossAllCaches(queryClient, tweet.id, createRetweetUpdater(isRetweet));
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context) {
        rollbackTweetUpdates(queryClient, context);
      }
    }
    // No onSuccess or onSettled - optimistic updates are sufficient
  });
}

// Bookmark/unbookmark tweet mutation
export function useBookmarkTweet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({tweet, isBookmark}: {tweet: Tweet, isBookmark: boolean}) => {
      const response = await api.tweets[':id'].bookmark.$post({ 
        param: { id: tweet.id },
        json: { isBookmark: isBookmark }
      });
      if (!response.ok) {
        throw new Error('Failed to toggle bookmark');
      }
      return await response.json();
    },
    onMutate: async ({tweet, isBookmark}) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tweets'] });
      
      // Optimistically update cache
      return updateTweetAcrossAllCaches(queryClient, tweet.id, createBookmarkUpdater(isBookmark));
    },
    onSuccess: () => {
      // Invalidate bookmarks query to refetch if needed
      queryClient.invalidateQueries({ queryKey: ['tweets', 'bookmarks'] });
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context) {
        rollbackTweetUpdates(queryClient, context);
      }
    }
  });
}