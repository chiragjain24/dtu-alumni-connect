import type { Tweet } from '@/types/types'

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

  const exploreTweets: Tweet[] = [
    {
      id: '1',
      content: '🎉 Congratulations to all DTU students who got placed in top companies this season! Special shoutout to our alumni who provided referrals. #DTUAlumni #Placements2024',
      authorId: 'placement-cell',
      isRetweet: false,
      likesCount: 312,
      retweetsCount: 128,
      repliesCount: 45,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      authorName: 'DTU Placement Cell',
      authorUsername: 'dtu_placements',
      authorImage: 'https://via.placeholder.com/150',
      mediaItems: [],
    },
    {
      id: '2', 
      content: 'Weekly tech meetup this Saturday at Cyber Hub, Gurgaon! Topics: AI/ML trends, startup opportunities, and networking. Alumni from Google, Microsoft, and Amazon will be present. #TechJobs',
      authorId: 'tech-alumni',
      isRetweet: false,
      likesCount: 156,
      retweetsCount: 67,
      repliesCount: 23,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      authorName: 'Tech Alumni Network',
      authorUsername: 'tech_alumni_dtu',
      authorImage: 'https://via.placeholder.com/150',
      mediaItems: [],
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
            tweet={tweet}
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