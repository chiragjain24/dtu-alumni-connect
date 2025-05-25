import { TweetCard } from '../components/tweets/tweet-card'
import { Search, TrendingUp } from 'lucide-react'

export default function Explore() {
  // Sample trending topics and tweets
  const trendingTopics = [
    { topic: '#DTUAlumni', tweets: '2,847 Tweets' },
    { topic: '#TechJobs', tweets: '1,234 Tweets' },
    { topic: '#Placement2024', tweets: '892 Tweets' },
    { topic: '#StartupLife', tweets: '567 Tweets' },
    { topic: '#Engineering', tweets: '3,421 Tweets' }
  ]

  const exploreTweets = [
    {
      user: {
        name: 'DTU Placement Cell',
        username: 'dtu_placements',
        avatar: undefined
      },
      content: '🎉 Congratulations to all DTU students who got placed in top companies this season! Special shoutout to our alumni who provided referrals. #DTUAlumni #Placements2024',
      timestamp: '3h',
      stats: {
        replies: 45,
        retweets: 128,
        likes: 312
      }
    },
    {
      user: {
        name: 'Tech Alumni Network',
        username: 'tech_alumni_dtu',
        avatar: undefined
      },
      content: 'Weekly tech meetup this Saturday at Cyber Hub, Gurgaon! Topics: AI/ML trends, startup opportunities, and networking. Alumni from Google, Microsoft, and Amazon will be present. #TechJobs',
      timestamp: '5h',
      stats: {
        replies: 23,
        retweets: 67,
        likes: 156
      }
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <h1 className="text-xl font-bold text-foreground">Explore</h1>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            placeholder="Search DTU Alumni Connect"
            className="w-full pl-12 pr-4 py-3 bg-muted rounded-full border-none focus:outline-none focus:ring-2 focus:ring-ring"
            disabled
          />
        </div>
      </div>

      {/* Trending Section */}
      <div className="border-b border-border">
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-bold text-foreground">Trending in DTU Community</h2>
          </div>
          
          <div className="space-y-3">
            {trendingTopics.map((trend, index) => (
              <div key={index} className="hover:bg-accent p-3 rounded-lg cursor-pointer transition-colors">
                <p className="font-bold text-foreground">{trend.topic}</p>
                <p className="text-sm text-muted-foreground">{trend.tweets}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Explore Timeline */}
      <div>
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Discover</h2>
          <p className="text-sm text-muted-foreground">Popular tweets from the DTU alumni community</p>
        </div>
        
        {exploreTweets.map((tweet, index) => (
          <TweetCard
            key={index}
            user={tweet.user}
            content={tweet.content}
            timestamp={tweet.timestamp}
            stats={tweet.stats}
          />
        ))}

        {/* Phase 2 Note */}
        <div className="p-6 text-center bg-muted border-b border-border">
          <p className="text-sm text-muted-foreground">
            Explore page - Part of Phase 2 Twitter-like UI implementation
          </p>
        </div>
      </div>
    </div>
  )
} 