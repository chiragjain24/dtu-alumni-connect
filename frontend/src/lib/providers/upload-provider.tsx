import React, { createContext, useContext, useMemo } from "react";
import { useUploadThing } from "@/lib/uploadthing";

// Type for upload function
type StartUploadFunction = (files: File[], input?: undefined) => Promise<any[] | undefined>;

// Context for cached upload functions
interface UploadContextType {
  startImageUpload: StartUploadFunction;
  startDocumentUpload: StartUploadFunction;
}

const UploadContext = createContext<UploadContextType | null>(null);

// Provider component that initializes upload functions once
export function UploadProvider({ children }: { children: React.ReactNode }) {
  const { startUpload: startImageUpload } = useUploadThing("tweetImageUploader");
  const { startUpload: startDocumentUpload } = useUploadThing("tweetDocumentUploader");

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    startImageUpload,
    startDocumentUpload,
  }), [startImageUpload, startDocumentUpload]);

  return (
    <UploadContext.Provider value={value}>
      {children}
    </UploadContext.Provider>
  );
}

// Hook to use cached upload functions
export function useCachedUploadThing() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useCachedUploadThing must be used within an UploadProvider');
  }
  return context;
} 