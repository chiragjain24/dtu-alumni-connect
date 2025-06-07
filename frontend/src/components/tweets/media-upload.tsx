import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Image, FileText, X } from 'lucide-react';
import { useDropzone } from '@uploadthing/react';
import { generateClientDropzoneAccept } from 'uploadthing/client';
import { toast } from 'sonner';

interface MediaUploadProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export function MediaUpload({ onFilesChange, maxFiles = 4, disabled = false }: MediaUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedFilesWithUrl, setSelectedFilesWithUrl] = useState<{file: File, url: string}[]>([]);

  // Maximum file size in bytes (2MB)
  const MAX_FILE_SIZE = 2 * 1024 * 1024;

  // Create preview URLs for images when files change
  useEffect(() => {
    const allFiles = selectedFiles.map(file => {
      if(file.type.startsWith('image/')){
        return {file, url: URL.createObjectURL(file)};
      }
      else{
        return {file, url: ''};
      }
    });
    setSelectedFilesWithUrl(allFiles);
    
    // Cleanup function to revoke object URLs to prevent memory leaks
    return () => {
      allFiles.forEach(file => {
        if(file.url !== ''){
          URL.revokeObjectURL(file.url);
        }
      });
    };
  }, [selectedFiles]);

  // Notify parent component when files change
  useEffect(() => {
    onFilesChange(selectedFiles);
  }, [selectedFiles, onFilesChange]);

  const validateFileSize = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name} is ${formatFileSize(file.size)}. Maximum file size allowed is 2MB.`;
    }
    return null;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles: File[] = [];

    // Validate each file
    acceptedFiles.forEach(file => {
      const error = validateFileSize(file);
      if (error) {
        toast.warning(error, {
          duration: 5000,
          position: 'top-center',
        });
      } else {
        validFiles.push(file);
      }
    });

    // Add valid files
    if (validFiles.length > 0) {
      const remainingSlots = maxFiles - selectedFiles.length;
      const filesToAdd = validFiles.slice(0, remainingSlots);
      setSelectedFiles(prev => [...prev, ...filesToAdd]);
    }
  }, [maxFiles, selectedFiles.length, MAX_FILE_SIZE]);

  // Accept both images and documents
  const fileTypes = ["image", "pdf"];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: generateClientDropzoneAccept(fileTypes),
    maxFiles: maxFiles - selectedFiles.length,
    disabled: disabled || selectedFiles.length >= maxFiles,
  });

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const getFileTypeLabel = (file: File) => {
    if (file.type.startsWith('image/')) return 'Image';
    if (file.type === 'application/pdf') return 'PDF';
    // if (file.type.includes('word')) return 'Word Doc';
    // if (file.type.includes('excel') || file.type.includes('sheet')) return 'Spreadsheet';
    // if (file.type.includes('powerpoint') || file.type.includes('presentation')) return 'Presentation';
    // if (file.type === 'text/plain') return 'Text File';
    // if (file.type === 'text/csv') return 'CSV File';
    return 'Document';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canAddMore = selectedFiles.length < maxFiles;

  return (
    <div className="space-y-3">
      {/* File Previews */}
      {selectedFilesWithUrl.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {selectedFilesWithUrl.map((file, index) => {
            if (file.file.type.startsWith('image/')) {
              return (
                <div key={file.file.name} className="relative group">
                  <img
                    src={file.url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFile(index)}
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )
            } 
            else {
              return (
                <div key={file.file.name} className="relative group">
                  <div className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/50">
                    <div className="flex-shrink-0">
                      {getFileIcon(file.file)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {file.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getFileTypeLabel(file.file)} • {formatFileSize(file.file.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFile(index)}
                      disabled={disabled}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )
            }
            })}
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
              ? 'Drop files here...'
              : `Click to upload images or pdf here (${selectedFiles.length}/${maxFiles})`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            (max 2MB each)
          </p>
        </div>
      )}
    </div>
  );
} 