import { TweetCard } from './tweet-card';
import { TweetComposer } from './tweet-composer';
import { useTimeline, useCreateTweet } from '@/lib/queries/tweets';
import { useSession } from '@/lib/auth-client';
import Loader from '@/components/loader';
import type { MediaItem } from '@/types/types';

export function Timeline() {
  const { data: session } = useSession();
  const { data: tweets, isLoading, error } = useTimeline();
  const createTweetMutation = useCreateTweet();

  const handleCreateTweet = async (content: string, mediaItems: MediaItem[]) => {
    await createTweetMutation.mutateAsync({ content, mediaItems });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Failed to load timeline. Please try again.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Tweet Composer */}
      {session?.user && (
        <TweetComposer
          user={{
            name: session.user.name,
            username: session.user.username || '',
            image: session.user.image || '',
          }}
          onTweet={handleCreateTweet}
          disabled={createTweetMutation.isPending}
        />
      )}

      {/* Timeline */}
      <div>
        {tweets && tweets.length > 0 ? (
          tweets.map((tweet) => (
            <TweetCard
              key={tweet.id}
              tweet={tweet}
            />
          ))
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <h3 className="text-lg font-semibold mb-2">Welcome to DTU Alumni Connect!</h3>
            <p>Be the first to share what's happening in your network.</p>
          </div>
        )}
      </div>
    </div>
  );
} 