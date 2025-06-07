import { useState } from 'react';
import { ImageModal } from './image-modal';

interface TweetMediaProps {
  mediaUrls: string[];
  className?: string;
}

export function TweetMedia({ mediaUrls, className = "" }: TweetMediaProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!mediaUrls || mediaUrls.length === 0) return null;

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
      <div className={`mt-3 ${className}`}>
        <div className={`grid gap-1 ${getGridClass(mediaUrls.length)} ${mediaUrls.length === 3 ? 'grid-rows-2' : ''}`}>
          {mediaUrls.map((image, index) => (
            <div
              key={index}
              className={`overflow-hidden rounded-lg border bg-muted ${getImageClass(mediaUrls.length, index)}`}
            >
              <img
                src={image}
                alt={`Tweet image ${index + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                onClick={(e) => handleImageClick(index, e)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        images={mediaUrls}
        initialIndex={selectedImageIndex}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
} 