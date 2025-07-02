import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { Tweet } from '@/types/types'
import { TweetReplyCard } from './tweet-reply-card'

interface TweetReplyThreadProps {
  reply: Tweet
  level?: number
}

export function TweetReplyThread({ reply, level = 0 }: TweetReplyThreadProps) {
  const [showFullThread, setShowFullThread] = useState(false)
  
  // Find the most engaging nested thread (highest like count in chain)
  const findMostEngagingThread = (replies: Tweet[]): Tweet | null => {
    if (!replies.length) return null
    
    // Calculate engagement score for each reply and its thread
    const getThreadEngagement = (tweet: Tweet): number => {
      const tweetScore = tweet.likesCount + tweet.repliesCount * 0.5
      const childrenScore = tweet.replies?.reduce((sum, child) => sum + getThreadEngagement(child), 0) || 0
      return tweetScore + childrenScore
    }
    
    return replies.reduce((mostEngaging, current) => {
      if (!mostEngaging) return current
      return getThreadEngagement(current) > getThreadEngagement(mostEngaging) ? current : mostEngaging
    }, replies[0])
  }

  // Build a single thread chain following the most engaging path
  const buildThreadChain = (tweet: Tweet): Tweet[] => {
    const chain = [tweet]
    let current = tweet
    
    while (current.replies && current.replies.length > 0) {
      const mostEngaging = findMostEngagingThread(current.replies)
      if (mostEngaging) {
        chain.push(mostEngaging)
        current = mostEngaging
      } else {
        break
      }
    }
    
    return chain
  }

  const hasNestedReplies = reply.replies && reply.replies.length > 0
  const mostEngagingThread = hasNestedReplies ? findMostEngagingThread(reply.replies!) : null
  const otherRepliesCount = hasNestedReplies ? reply.replies!.length - 1 : 0
  
  // Get the full thread chain starting from the most engaging reply
  const threadChain = mostEngagingThread ? buildThreadChain(mostEngagingThread) : []
  const threadDepth = threadChain.length

  return (
    <div className={level === 0 ? "border-b-2 border-border" : ""}>
      {/* Main reply */}
      <TweetReplyCard 
        tweet={reply}
        showConnector={level > 0}
        isLast={!hasNestedReplies}
        level={level}
      />
      
      {/* Nested replies */}
      {hasNestedReplies && (
        <>
          {/* Always show the first reply from the most engaging thread */}
          <TweetReplyCard 
            tweet={mostEngagingThread!}
            showConnector={true}
            isLast={!showFullThread && threadDepth <= 1 && otherRepliesCount === 0}
            level={level + 1}
          />
          
          {showFullThread && (
            <>
              {/* Show the rest of the thread chain ONLY - no other replies */}
              {threadChain.slice(1).map((chainTweet, index) => (
                <TweetReplyCard 
                  key={chainTweet.id}
                  tweet={chainTweet}
                  showConnector={true}
                  isLast={index === threadChain.length - 2}
                  level={level + 1}
                />
              ))}
            </>
          )}
          
          {/* Show/Hide button */}
          {(threadDepth > 1 || otherRepliesCount > 0) && (
            <div className="px-4 pb-1 pt-1 hover:bg-accent/50 transition-colors relative">
              {/* Threading line continuation */}
              {!showFullThread && <div className="absolute left-9 top-0 w-0.5 bg-border h-6"></div>}
              
              <div className="flex space-x-3">
                <div className="w-9"></div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullThread(!showFullThread)}
                  className="text-primary hover:text-primary/80 text-sm font-medium p-2 h-auto"
                >
                  {showFullThread ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Hide replies
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Show replies
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
} 