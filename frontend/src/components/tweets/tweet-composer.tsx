import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Image, Smile, Calendar, MapPin } from 'lucide-react'

interface TweetComposerProps {
  user: {
    name: string
    username: string
    avatar?: string | null
  }
  placeholder?: string
  onTweet?: (content: string) => void
  disabled?: boolean
}

export function TweetComposer({ 
  user, 
  placeholder = "What's happening?", 
  onTweet,
  disabled = true 
}: TweetComposerProps) {
  return (
    <div className="border-b border-border p-4">
      <div className="flex space-x-3">
        <Avatar className="w-12 h-12">
          <AvatarImage src={user.avatar || undefined} alt={`${user.name} avatar`} />
          <AvatarFallback>
            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="bg-muted rounded-xl p-4 cursor-pointer hover:bg-muted/80 transition-colors">
            <p className="text-muted-foreground text-lg">{placeholder}</p>
          </div>
          
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
            
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-2 rounded-full"
              disabled={disabled}
              onClick={() => onTweet?.('')}
            >
              Tweet
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 