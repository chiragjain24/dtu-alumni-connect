import { Button } from '../components/ui/button'
import { TweetCard } from '../components/tweets/tweet-card'
import { Briefcase, MapPin, Clock, ExternalLink } from 'lucide-react'
import type { Tweet } from '@/types/types'
export default function Jobs() {
  // Sample job postings
  const jobPosts: Tweet[] = [
    {
      id: '1',
      content: '🚀 We\'re hiring Senior Software Engineers at Google Bangalore! Looking for DTU alumni with 3+ years experience in React/Node.js. Great opportunity for growth and learning. DM me for referrals! #TechJobs #DTUAlumni #Google',
      authorId: '1',
      isRetweet: false,
      likesCount: 89,
      retweetsCount: 45,
      repliesCount: 28,
      mediaItems: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorName: 'Rahul Sharma',
      authorUsername: 'rahul_dtu_2018',
      authorImage: '',
    },
    {
      id: '2',
      content: '🚀 We\'re hiring Senior Software Engineers at Google Bangalore! Looking for DTU alumni with 3+ years experience in React/Node.js. Great opportunity for growth and learning. DM me for referrals! #TechJobs #DTUAlumni #Google',
      authorId: '1',
      isRetweet: false,
      likesCount: 89,
      retweetsCount: 45,
      repliesCount: 28,
      mediaItems: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorName: 'Rahul Sharma',
      authorUsername: 'rahul_dtu_2018',
      authorImage: '',
    }
  ]

  const featuredJobs = [
    {
      company: 'Google',
      position: 'Senior Software Engineer',
      location: 'Bangalore',
      type: 'Full-time',
      postedBy: 'Rahul Sharma (DTU \'18)'
    },
    {
      company: 'Microsoft',
      position: 'Product Manager',
      location: 'Hyderabad',
      type: 'Full-time',
      postedBy: 'Priya Gupta (DTU \'17)'
    },
    {
      company: 'Amazon',
      position: 'Data Scientist',
      location: 'Delhi',
      type: 'Full-time',
      postedBy: 'Amit Kumar (DTU \'19)'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 z-10 flex items-center gap-4">
        <div className="h-[2rem] flex flex-col justify-center">
          <h1 className="text-xl font-bold text-foreground">Jobs</h1>
        </div>
      </div>

      {/* Post Job Button */}
      <div className="p-4 border-b border-border">
        <Button 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-full"
          disabled
        >
          <Briefcase className="w-5 h-5 mr-2" />
          Post a Job Opportunity
        </Button>
      </div>

      {/* Featured Jobs Section */}
      <div className="border-b border-border">
        <div className="p-4">
          <h2 className="text-lg font-bold text-foreground mb-4">Featured Opportunities</h2>
          
          <div className="space-y-4">
            {featuredJobs.map((job, index) => (
              <div key={index} className="bg-muted rounded-lg p-4 hover:bg-muted/80 transition-colors cursor-pointer">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{job.position}</h3>
                    <p className="text-primary font-medium">{job.company}</p>
                    
                    <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{job.type}</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-2">Posted by {job.postedBy}</p>
                  </div>
                  
                  <Button variant="outline" size="sm" disabled>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Job Posts Timeline */}
      <div>
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Recent Job Posts</h2>
          <p className="text-sm text-muted-foreground">Job opportunities shared by DTU alumni</p>
        </div>
        
        {jobPosts.map((post, index) => (
          <TweetCard
            key={index}
            tweet={post}
          />
        ))}

      </div>
    </div>
  )
} 