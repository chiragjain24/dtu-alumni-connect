import { useState } from 'react';
import { ImageModal } from './image-modal';
import { DocumentCard } from './document-card';
import type { MediaItem } from '@/types/types';

interface TweetMediaProps {
  mediaItems: MediaItem[] | null;
  className?: string;
}

export function TweetMedia({ mediaItems, className = "" }: TweetMediaProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!mediaItems || mediaItems.length === 0) return null;

  // Separate images and documents
  const images = mediaItems.filter(item => item.type === 'image');
  const documents = mediaItems.filter(item => item.type === 'document');

  const getGridClass = (count: number) => {
    switch (count) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-2";
      case 4:
        return "grid-cols-2";
      default:
        return "grid-cols-2";
    }
  };

  const getImageClass = (count: number, index: number) => {
    if (count === 1) {
      return "aspect-video max-h-80";
    }
    if (count === 2) {
      return "aspect-square";
    }
    if (count === 3) {
      if (index === 0) {
        return "row-span-2 aspect-square";
      }
      return "aspect-square";
    }
    if (count === 4) {
      return "aspect-square";
    }
    return "aspect-square";
  };

  const handleImageClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent tweet navigation when clicking images
    setSelectedImageIndex(index);
    setModalOpen(true);
  };

  return (
    <>
      <div className={`mt-3 space-y-3 ${className}`}>
        {/* Images Grid */}
        {images.length > 0 && (
          <div className={`grid gap-1 ${getGridClass(images.length)} ${images.length === 3 ? 'grid-rows-2' : ''}`}>
            {images.map((image, index) => (
              <div
                key={index}
                className={`overflow-hidden rounded-lg border bg-muted ${getImageClass(images.length, index)}`}
              >
                <img
                  src={image.url}
                  alt={image.name || `Image ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                  onClick={(e) => handleImageClick(index, e)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Documents List */}
        {documents.length > 0 && (
          <div className="space-y-2">
            {documents.map((document, index) => (
              <DocumentCard
                key={index}
                document={document}
              />
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {images.length > 0 && (
        <ImageModal
          images={images.map(img => img.url)}
          initialIndex={selectedImageIndex}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
} 