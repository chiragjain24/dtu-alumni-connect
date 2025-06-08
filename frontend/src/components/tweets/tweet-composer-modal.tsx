import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { TweetComposer } from './tweet-composer'
import { useCreateTweet } from '@/lib/queries/tweets'
import { useSession } from '@/lib/auth-client'
import type { MediaItem } from '@/types/types'

interface TweetComposerModalProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export function TweetComposerModal({ open, setOpen }: TweetComposerModalProps) {
  const { data: session } = useSession()
  const createTweetMutation = useCreateTweet()

  const handleCreateTweet = async (content: string, mediaItems: MediaItem[]) => {
    await createTweetMutation.mutateAsync({ content, mediaItems })
    setOpen(false) // Close modal after successful tweet
  }

  if (!session?.user) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-0 sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-left">Compose Tweet</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="rounded-full hover:bg-accent"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>
        <div className="px-0">
          <TweetComposer
            user={{
              name: session.user.name,
              username: session.user.username || '',
              image: session.user.image || '',
            }}
            onTweet={handleCreateTweet}
            disabled={createTweetMutation.isPending}
            variant="modal"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
} 