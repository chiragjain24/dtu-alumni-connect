import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
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
    
    // Handle Infinite Query with User Replies Structure (user replies timeline)
    if (currentData?.pages?.[0]?.tweets?.[0]?.tweet) {
      updatedData = {
        ...currentData,
        pages: currentData.pages.map((page: any) => ({
          ...page,
          tweets: page.tweets.map((item: any) => {
            if (item.tweet.id === tweetId) {
              return {
                ...item,
                tweet: updater(item.tweet)
              };
            }
            // Check parent tweets
            if (item.parentTweets.some((t: Tweet) => t.id === tweetId)) {
              return {
                ...item,
                parentTweets: item.parentTweets.map((t: Tweet) => t.id === tweetId ? updater(t) : t)
              };
            }
            // Check nested replies
            if (item.replies && item.replies.length > 0) {
              return {
                ...item,
                replies: updateNestedReplies(item.replies)
              };
            }
            return item;
          })
        }))
      };
    }
    // Handle Infinite Query with Regular Tweet Structure (timeline)
    else if (currentData.pages && Array.isArray(currentData.pages)) {
      updatedData = {
        ...currentData,
        pages: currentData.pages.map((page: any) => ({
          ...page,
          tweets: page.tweets.map((tweet: Tweet) => {
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
          })
        }))
      };
    }
    // Handle Array of Tweet + parentTweets + replies (user replies structure)
    else if (Array.isArray(currentData) && currentData.length > 0 && currentData[0].tweet && currentData[0].parentTweets && currentData[0].replies) {
      updatedData = currentData.map(item => {
        if(item.tweet.id === tweetId) {
          return {
            ...item,
            tweet: updater(item.tweet)
          }
        }
        else if(item.parentTweets.some((t: Tweet) => t.id === tweetId)) {
          return {
            ...item,
            parentTweets: item.parentTweets.map((t: Tweet) => t.id === tweetId ? updater(t) : t)
          }
        }
        else {
          return {
            ...item,
            replies: updateNestedReplies(item.replies)
          }
        }
      });
    }
    // Handle Array of Tweets (legacy)
    else if (Array.isArray(currentData)) {
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

// Timeline tweets query with infinite scroll
export function useTimeline() {
  return useInfiniteQuery({
    queryKey: ['tweets', 'timeline'],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const response = await api.tweets.timeline.$get({
        query: { limit: '40' , cursor: pageParam }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch timeline');
      }
      
      return response.json();
    },
    getNextPageParam: (lastPage: { nextCursor: string | null; hasMore: boolean; tweets: Tweet[] }) => lastPage.nextCursor,
    initialPageParam: undefined,
    refetchOnWindowFocus: false,
    refetchInterval: 300000, // 5 minutes
    staleTime: 60000, // 1 minute
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
    refetchOnMount: 'always',
    refetchInterval: 20000, // 20 seconds
    staleTime: 0,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.cause === 404) {
        return false
      }
      return failureCount < 3
    }
  });
}

// Bookmarked tweets query with infinite scroll
export function useBookmarkedTweetsInfinite() {
  return useInfiniteQuery({
    queryKey: ['tweets', 'bookmarks'],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const response = await api.tweets.bookmarks.$get({
        query: { limit: '40', cursor: pageParam }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookmarked tweets');
      }
      
      return response.json();
    },
    getNextPageParam: (lastPage: { nextCursor: string | null; hasMore: boolean; tweets: Tweet[] }) => lastPage.nextCursor,
    initialPageParam: undefined,
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
      
      // If it's a reply, invalidate the parent tweet and user replies
      if (newTweet.parentTweetId) {
        queryClient.invalidateQueries({ queryKey: ['tweets', newTweet.parentTweetId] });
        queryClient.invalidateQueries({ queryKey: ['tweets', 'user', 'replies', newTweet.authorId] });
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
        
        // Handle Infinite Query with User Replies Structure (user replies timeline)
        if (currentData?.pages?.[0]?.tweets?.[0]?.tweet) {
          const updatedData = {
            ...currentData,
            pages: currentData.pages.map((page: any) => ({
              ...page,
              tweets: page.tweets
                .filter((item: any) => {
                  // Remove the entire item if the main tweet is being deleted
                  return item.tweet.id !== tweet.id;
                })
                .map((item: any) => {
                  // If any parent tweet is being deleted, remove it from parentTweets
                  if (item.parentTweets.some((t: Tweet) => t.id === tweet.id)) {
                    return {
                      ...item,
                      parentTweets: item.parentTweets.filter((t: Tweet) => t.id !== tweet.id)
                    };
                  }
                  return item;
                })
            }))
          };
          queryClient.setQueryData(queryKey, updatedData);
        }
        // Handle Infinite Query with Regular Tweet Structure (timeline)
        else if (currentData.pages && Array.isArray(currentData.pages)) {
          const updatedData = {
            ...currentData,
            pages: currentData.pages.map((page: any) => ({
              ...page,
              tweets: page.tweets.filter((t: Tweet) => t.id !== tweet.id)
            }))
          };
          queryClient.setQueryData(queryKey, updatedData);
        }
        // Handle Array of Tweets (legacy)
        else if (Array.isArray(currentData)) {
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
    }
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