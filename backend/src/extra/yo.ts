
// // GET /api/tweets/:id - Get single tweet (OPTIMIZED - Single DB call)
// .get('/:id', requireAuth, zValidator('param', tweetParamsSchema), async (c) => {
//     const currentUser = c.get('user');
//     const { id } = c.req.valid('param');
  
//     try {
//       // Single query to get main tweet, all parents, and all replies in the thread
//       const allThreadTweets = await db
//         .select({
//           id: tweets.id,
//           content: tweets.content,
//           authorId: tweets.authorId,
//           parentTweetId: tweets.parentTweetId,
//           isRetweet: tweets.isRetweet,
//           originalTweetId: tweets.originalTweetId,
//           likesCount: tweets.likesCount,
//           retweetsCount: tweets.retweetsCount,
//           repliesCount: tweets.repliesCount,
//           createdAt: tweets.createdAt,
//           updatedAt: tweets.updatedAt,
//           authorName: users.name,
//           authorUsername: users.username,
//           authorImage: users.image,
//           isLikedByUser: sql<boolean>`CASE WHEN ${likes.userId} IS NOT NULL THEN true ELSE false END`,
//           isRetweetedByUser: sql<boolean>`CASE WHEN ${retweets.userId} IS NOT NULL THEN true ELSE false END`,
//           // Add a field to identify the tweet type for easier processing
//           tweetType: sql<string>`
//             CASE 
//               WHEN tweets.id = ${id} THEN 'main'
//               WHEN tweets.id IN (
//                 WITH RECURSIVE parent_tree AS (
//                   SELECT parent_tweet_id as id, 1 as level
//                   FROM tweets 
//                   WHERE tweets.id = ${id} AND parent_tweet_id IS NOT NULL
                  
//                   UNION ALL
                  
//                   SELECT t.parent_tweet_id as id, pt.level + 1 as level
//                   FROM tweets t
//                   INNER JOIN parent_tree pt ON t.id = pt.id
//                   WHERE t.parent_tweet_id IS NOT NULL AND pt.level < 50
//                 )
//                 SELECT id FROM parent_tree
//               ) THEN 'parent'
//               ELSE 'reply'
//             END
//           `
//         })
//         .from(tweets)
//         .leftJoin(users, eq(tweets.authorId, users.id))
//         .leftJoin(likes, and(
//           eq(likes.tweetId, tweets.id),
//           eq(likes.userId, currentUser!.id)
//         ))
//         .leftJoin(retweets, and(
//           eq(retweets.tweetId, tweets.id),
//           eq(retweets.userId, currentUser!.id)
//         ))
//         .where(sql`
//           tweets.id = ${id} OR
//           -- Get parent tweets
//           tweets.id IN (
//             WITH RECURSIVE parent_tree AS (
//               SELECT parent_tweet_id as id, 1 as level
//               FROM tweets 
//               WHERE tweets.id = ${id} AND parent_tweet_id IS NOT NULL
              
//               UNION ALL
              
//               SELECT t.parent_tweet_id as id, pt.level + 1 as level
//               FROM tweets t
//               INNER JOIN parent_tree pt ON t.id = pt.id
//               WHERE t.parent_tweet_id IS NOT NULL AND pt.level < 50
//             )
//             SELECT id FROM parent_tree
//           ) OR
//           -- Get reply tweets
//           (
//             parent_tweet_id IS NOT NULL AND (
//               parent_tweet_id = ${id} OR
//               EXISTS (
//                 WITH RECURSIVE reply_tree AS (
//                   SELECT id, parent_tweet_id FROM tweets WHERE parent_tweet_id = ${id}
//                   UNION ALL
//                   SELECT t.id, t.parent_tweet_id 
//                   FROM tweets t
//                   INNER JOIN reply_tree rt ON t.parent_tweet_id = rt.id
//                 )
//                 SELECT 1 FROM reply_tree WHERE reply_tree.id = tweets.id
//               )
//             )
//           )
//         `);
  
//       // Separate the results into different categories
//       const mainTweet = allThreadTweets.find(t => t.tweetType === 'main');
//       const parentTweets = allThreadTweets
//         .filter(t => t.tweetType === 'parent')
//         .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); // Chronological order
//       const allReplies = allThreadTweets
//         .filter(t => t.tweetType === 'reply')
//         .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Reverse chronological
  
//       if (!mainTweet) {
//         throw new HTTPException(404, { message: 'Tweet not found' });
//       }
  
//       // Build nested structure - only direct replies to the main tweet
//       const nestedReplies = buildNestedReplies(allReplies, id);
  
//       // Remove the tweetType field from the response objects using destructuring
//       const { tweetType: _, ...cleanTweet } = mainTweet;
      
//       const cleanParentTweets = parentTweets.map(tweet => {
//         const { tweetType: _, ...clean } = tweet;
//         return clean;
//       });
  
//       const cleanReplies = nestedReplies.map(function cleanReply(reply: any): any {
//         const { tweetType: _, ...clean } = reply;
//         if (clean.replies) {
//           clean.replies = clean.replies.map(cleanReply);
//         }
//         return clean;
//       });
  
//       return c.json({ 
//         tweet: cleanTweet, 
//         parentTweets: cleanParentTweets, 
//         replies: cleanReplies 
//       });
//     } catch (error) {
//       console.error('Error fetching tweet:', error);
//       if (error instanceof HTTPException) {
//         throw error;
//       }
//       throw new HTTPException(500, { message: 'Failed to fetch tweet' });
//     }
//   })
  