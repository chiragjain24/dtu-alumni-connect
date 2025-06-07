import { Button } from '@/components/ui/button';
import { FileText, Download, ExternalLink, File, FileSpreadsheet, FileImage } from 'lucide-react';
import { toast } from 'sonner';
import type { MediaItem } from '@/types/types';

interface DocumentCardProps {
  document: MediaItem;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (mimeType.includes('word') || mimeType.includes('document')) {
      return <FileText className="h-5 w-5 text-blue-500" />;
    }
    if (mimeType.includes('excel') || mimeType.includes('sheet')) {
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    }
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
      return <FileImage className="h-5 w-5 text-orange-500" />;
    }
    if (mimeType.includes('text')) {
      return <FileText className="h-5 w-5 text-gray-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const getFileTypeLabel = (mimeType: string) => {
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('word')) return 'Word Document';
    if (mimeType.includes('document')) return 'Document';
    if (mimeType.includes('excel')) return 'Excel Spreadsheet';
    if (mimeType.includes('sheet')) return 'Spreadsheet';
    if (mimeType.includes('powerpoint')) return 'PowerPoint';
    if (mimeType.includes('presentation')) return 'Presentation';
    if (mimeType.includes('text/plain')) return 'Text File';
    if (mimeType.includes('text/csv')) return 'CSV File';
    return 'Document';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(document.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Document downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download document');
      console.error('Download error:', error);
    }
  };

  const handleOpenInNewTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(document.url, '_blank');
  };

  return (
    <div 
      className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group cursor-pointer"
      onClick={handleOpenInNewTab}
    >
      <div className="flex-shrink-0">
        {getFileIcon(document.mimeType)}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {document.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {getFileTypeLabel(document.mimeType)} • {formatFileSize(document.size)}
        </p>
      </div>
      
      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className="h-8 w-8 p-0"
          title="Download document"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpenInNewTab}
          className="h-8 w-8 p-0"
          title="Open in new tab"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 