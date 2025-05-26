import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Image, Smile, Calendar, MapPin } from 'lucide-react'
import { useState } from 'react'

interface TweetComposerProps {
  user: {
    name: string
    username: string
    image: string
  }
  placeholder?: string
  onTweet?: (content: string) => void
  disabled?: boolean
  parentTweetId?: string
}

export function TweetComposer({ 
  user, 
  placeholder = "What's happening?", 
  onTweet,
  disabled = false,
  parentTweetId
}: TweetComposerProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onTweet?.(content);
      setContent('');
      setIsExpanded(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = disabled || !content.trim() || isSubmitting;

  return (
    <div className="border-b border-border p-4">
      <div className="flex space-x-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={user.image || undefined} alt={`${user.name} avatar`} />
          <AvatarFallback>
            {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="relative">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              placeholder={placeholder}
              className="md:text-base border-none min-h-12 shadow-none resize-none focus-visible:ring-0 p-0 pr-20"
              maxLength={2048}
            />
            
            {!isExpanded && (
              <Button 
                className="absolute right-2 top-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 py-1 rounded-full text-sm"
                disabled={isDisabled}
                onClick={handleSubmit}
              >
                {isSubmitting ? 'Posting...' : parentTweetId ? 'Reply' : 'Tweet'}
              </Button>
            )}
          </div>
          
          {isExpanded && (
            <div className="flex justify-between items-center mt-3">
              <div className="flex space-x-4 text-primary">
                <Button variant="ghost" size="sm" className="rounded-full p-2" disabled>
                  <Image className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" className="rounded-full p-2" disabled>
                  <Smile className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" className="rounded-full p-2" disabled>
                  <Calendar className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" className="rounded-full p-2" disabled>
                  <MapPin className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-2 rounded-full"
                  disabled={isDisabled}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? 'Posting...' : parentTweetId ? 'Reply' : 'Tweet'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 