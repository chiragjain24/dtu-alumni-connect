import {
  generateUploadButton,
  generateUploadDropzone,
  generateReactHelpers,
} from "@uploadthing/react";

import type { UploadFileRouter } from "@backend/src/lib/uploadthing";

const API_URL = import.meta.env.VITE_BACKEND_URL;

export const UploadButton = generateUploadButton<UploadFileRouter>({
  url: `${API_URL}/api/uploadthing`,
});

export const UploadDropzone = generateUploadDropzone<UploadFileRouter>({
  url: `${API_URL}/api/uploadthing`,
});

export const { useUploadThing } = generateReactHelpers<UploadFileRouter>({
  url: `${API_URL}/api/uploadthing`,
}); 