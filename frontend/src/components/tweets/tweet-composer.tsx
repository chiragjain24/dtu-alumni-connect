import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Image, Smile, Calendar } from 'lucide-react'
import { useState } from 'react'
import { MediaUpload } from './media-upload'
import { useCachedUploadThing } from '@/lib/providers/upload-provider'
import type { MediaItem } from '@/types/types'
import { toast } from 'sonner'

interface TweetComposerProps {
  user: {
    name: string
    username: string
    image: string
  }
  placeholder?: string
  onTweet?: (content: string, mediaItems: MediaItem[]) => Promise<void>
  disabled?: boolean
  parentTweetId?: string
  variant?: 'default' | 'modal'
}

export function TweetComposer({ 
  user, 
  placeholder = "What's happening?", 
  onTweet,
  disabled = false,
  parentTweetId,
  variant = 'default'
}: TweetComposerProps) {
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(variant === 'modal' ? true : false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);

  const { startImageUpload, startDocumentUpload } = useCachedUploadThing();

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      let mediaItems: MediaItem[] = [];
      
      // Upload files if any are selected
      if (selectedFiles.length > 0) {
        const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
        const documentFiles = selectedFiles.filter(file => !file.type.startsWith('image/'));

        let uploadResults = [];

        if (imageFiles.length > 0) {
          const imageUploadResults = await startImageUpload(imageFiles);
          if (imageUploadResults) {
            uploadResults.push(...imageUploadResults);
          }
        }

        if (documentFiles.length > 0) {
          const docUploadResults = await startDocumentUpload(documentFiles);
          if (docUploadResults) {
            uploadResults.push(...docUploadResults);
          }
        }

        if(uploadResults.length !== selectedFiles.length){
          throw new Error('Some files failed to upload');
        }

        if (uploadResults.length > 0) {
          mediaItems = uploadResults.map(result => ({
            url: result.ufsUrl,
            type: result.serverData.type === 'image' ? 'image' : 'document',
            name: result.name || 'file',
            size: result.size || 0,
            mimeType: result.serverData.mimeType || 'application/octet-stream'
          }));
        }
      }
      
      await onTweet?.(content, mediaItems);
      setContent('');
      setSelectedFiles([]);
      setIsExpanded(false);
      setShowMediaUpload(false);
      
    } catch(error){
      console.error(error);
      toast.error('Failed to post tweet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = disabled || !content.trim() || isSubmitting;

  return (
    <div className={`p-4 ${variant === 'default' ? 'border-b border-border' : ''}`}>
      <div className="flex space-x-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={user.image || undefined} alt={`${user.name} avatar`} />
          <AvatarFallback>
            {user.name.split(' ')[0][0]?.toUpperCase()}
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
          
          {/* Media Upload Section */}
          {showMediaUpload && (
            <div className="mt-3">
              <MediaUpload
                onFilesChange={setSelectedFiles}
                disabled={isSubmitting}
                maxFiles={4}
              />
            </div>
          )}
          
          {isExpanded && (
            <div className="flex justify-between items-center mt-3">
              <div className="flex space-x-4 text-primary">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full p-2"
                  onClick={() => setShowMediaUpload(!showMediaUpload)}
                  disabled={isSubmitting}
                >
                  <Image className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" className="rounded-full p-2" disabled>
                  <Smile className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" className="rounded-full p-2" disabled>
                  <Calendar className="w-5 h-5" />
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