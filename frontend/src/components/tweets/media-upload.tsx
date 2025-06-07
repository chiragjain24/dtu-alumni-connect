import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Image, X } from 'lucide-react';
import { useUploadThing } from '@/lib/uploadthing';
import { useDropzone } from '@uploadthing/react';
import { generateClientDropzoneAccept } from 'uploadthing/client';

interface MediaUploadProps {
  onMediaChange: (urls: string[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export function MediaUpload({ onMediaChange, maxFiles = 4, disabled = false }: MediaUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { startUpload, routeConfig } = useUploadThing("tweetImageUploader", {
    onClientUploadComplete: (res) => {
      const urls = res.map(file => file.url);
      setUploadedUrls(prev => [...prev, ...urls]);
      onMediaChange([...uploadedUrls, ...urls]);
      setFiles([]);
      setIsUploading(false);
    },
    onUploadError: (error) => {
      console.error("Upload failed:", error);
      setIsUploading(false);
    },
    onUploadBegin: () => {
      setIsUploading(true);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const remainingSlots = maxFiles - uploadedUrls.length;
    const filesToAdd = acceptedFiles.slice(0, remainingSlots);
    setFiles(prev => [...prev, ...filesToAdd]);
  }, [maxFiles, uploadedUrls.length]);

  const fileTypes = routeConfig?.image ? ["image"] : [];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: fileTypes ? generateClientDropzoneAccept(fileTypes) : undefined,
    maxFiles: maxFiles - uploadedUrls.length,
    disabled: disabled || isUploading || uploadedUrls.length >= maxFiles,
  });

  const handleUpload = () => {
    if (files.length > 0) {
      startUpload(files);
    }
  };

  const removeUploadedImage = (indexToRemove: number) => {
    const newUrls = uploadedUrls.filter((_, index) => index !== indexToRemove);
    setUploadedUrls(newUrls);
    onMediaChange(newUrls);
  };

  const removeFileFromQueue = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const canAddMore = uploadedUrls.length + files.length < maxFiles;

  return (
    <div className="space-y-3">
      {/* Uploaded Images */}
      {uploadedUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {uploadedUrls.map((url, index) => (
            <div key={url} className="relative group">
              <img
                src={url}
                alt={`Uploaded ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeUploadedImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Files in Queue */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {files.map((file, index) => (
              <div key={file.name} className="relative group">
                <div className="w-full h-32 bg-muted rounded-lg border flex items-center justify-center">
                  <div className="text-center">
                    <Image className="h-8 w-8 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground truncate px-2">
                      {file.name}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFileFromQueue(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? 'Uploading...' : `Upload ${files.length} image${files.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      )}

      {/* Upload Area */}
      {canAddMore && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isDragActive
              ? 'Drop images here...'
              : `Drag & drop images here, or click to select (${uploadedUrls.length + files.length}/${maxFiles})`}
          </p>
        </div>
      )}
    </div>
  );
} 