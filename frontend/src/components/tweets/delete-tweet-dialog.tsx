import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Trash2 } from 'lucide-react'
import { useDeleteTweet } from '@/lib/queries/tweets'
import type { Tweet } from '@/types/types'
import { toast } from 'sonner'

interface DeleteTweetDialogProps {
  tweet: Tweet
  onDeleteSuccess?: () => void
}

export function DeleteTweetDialog({ tweet, onDeleteSuccess }: DeleteTweetDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const deleteMutation = useDeleteTweet()

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(tweet)
      setIsOpen(false)
      onDeleteSuccess?.()

    } catch (error) {
      toast.error('Failed to delete tweet')
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!deleteMutation.isPending) {
      setIsOpen(open)
    }
  }

  return (
    <>
      <DropdownMenuItem 
        onSelect={(e) => {
          e.preventDefault()
          setIsOpen(true)
        }}
        className="text-red-600 focus:text-red-600"
        data-action="prevent"
        disabled={deleteMutation.isPending}
      >
        <Trash2 className="w-4 h-4 mr-2" />
        {deleteMutation.isPending ? 'Deleting...' : 'Delete tweet'}
      </DropdownMenuItem>

      <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tweet</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your tweet and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 