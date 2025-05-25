import { TweetCard } from '../components/tweets/tweet-card'
import { TweetComposer } from '../components/tweets/tweet-composer'
import useGetMyProfile from '@/lib/hooks/get-my-profile'
import Loader from '@/components/loader'

export default function Home() {
  const { data: profile, isPending } = useGetMyProfile()

  if (isPending) return <Loader />

  // Sample tweets data - will be replaced with real data in Phase 3
  const sampleTweets = [
    {
      user: {
        name: profile?.user.name || 'Your Name',
        username: profile?.user.username || 'username',
        avatar: profile?.user.image
      },
      content: 'Welcome to DTU Alumni Connect! 🎉 This is a Twitter-like platform for DTU alumni to connect, share opportunities, and network with fellow graduates.',
      timestamp: '2h',
      stats: {
        replies: 12,
        retweets: 5,
        likes: 23
      }
    },
    {
      user: {
        name: 'John Doe',
        username: 'johndoe_dtu',
        avatar: undefined
      },
      content: 'Just landed a new role at Google! Thanks to the DTU alumni network for the referral. Always happy to help fellow DTU graduates. #DTUAlumni #TechJobs',
      timestamp: '4h',
      stats: {
        replies: 8,
        retweets: 15,
        likes: 42
      }
    },
    {
      user: {
        name: 'Sarah Wilson',
        username: 'sarah_dtu_2019',
        avatar: undefined
      },
      content: 'Hosting a DTU alumni meetup in Bangalore next weekend! DM me if you\'re interested in joining. Great opportunity to network and catch up! 🚀',
      timestamp: '6h',
      stats: {
        replies: 15,
        retweets: 8,
        likes: 31
      }
    }
  ]

  const currentUser = {
    name: profile?.user.name || 'Your Name',
    username: profile?.user.username || 'username',
    avatar: profile?.user.image
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <h1 className="text-xl font-bold text-foreground">Home</h1>
      </div>

      {/* Tweet Composer */}
      <TweetComposer user={currentUser} />

      {/* Timeline */}
      <div>
        {sampleTweets.map((tweet, index) => (
          <TweetCard
            key={index}
            user={tweet.user}
            content={tweet.content}
            timestamp={tweet.timestamp}
            stats={tweet.stats}
          />
        ))}

        {/* Phase 2 Complete Message */}
        <div className="p-6 text-center bg-muted border-b border-border">
          <h3 className="text-lg font-bold text-primary mb-4">
            🎉 Phase 2 Complete - Twitter-like UI & Layout! 🎉
          </h3>
          
          <div className="text-left max-w-2xl mx-auto space-y-3">
            <h4 className="font-bold text-foreground mb-2">✅ Completed Features:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Twitter-like Navigation:</strong> Left sidebar with responsive design</li>
              <li>• <strong>Home Feed:</strong> Tweet timeline with sample content</li>
              <li>• <strong>Explore Page:</strong> Trending topics and discovery feed</li>
              <li>• <strong>Jobs Board:</strong> Job postings and referral system UI</li>
              <li>• <strong>Reusable Components:</strong> TweetCard, TweetComposer, Avatar</li>
              <li>• <strong>Responsive Layout:</strong> Mobile-friendly design (lg/sm/xs breakpoints)</li>
              <li>• <strong>Twitter-like Interactions:</strong> Like, retweet, reply, share buttons</li>
              <li>• <strong>Proper Routing:</strong> All navigation pages with placeholder content</li>
              <li>• <strong>Theme Colors:</strong> Using Shadcn/Tailwind CSS variables for consistency</li>
            </ul>
            
            <div className="mt-4 pt-3 border-t border-border">
              <h4 className="font-bold text-foreground mb-2">🚀 Next Phase:</h4>
              <p className="text-sm text-muted-foreground">
                Phase 3 will implement the backend integration, real tweet system, 
                user interactions, and database connectivity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 