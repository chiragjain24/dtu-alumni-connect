import {
  generateUploadButton,
  generateUploadDropzone,
  generateReactHelpers,
} from "@uploadthing/react";

import type { UploadFileRouter } from "@backend/src/lib/uploadthing";

const API_URL = import.meta.env.VITE_BACKEND_URL;

const fetchWithCookies = (input: RequestInfo | URL, init?: RequestInit) => {
  if (input.toString().startsWith(API_URL)) {
    return fetch(input, {
      ...init,
      credentials: 'include',
    });
  }
  return fetch(input, init);
};

export const UploadButton = generateUploadButton<UploadFileRouter>({
  url: `${API_URL}/api/uploadthing`,
  fetch: fetchWithCookies,
});

export const UploadDropzone = generateUploadDropzone<UploadFileRouter>({
  url: `${API_URL}/api/uploadthing`,
  fetch: fetchWithCookies,
});

export const { useUploadThing } = generateReactHelpers<UploadFileRouter>({
  url: `${API_URL}/api/uploadthing`,
  fetch: fetchWithCookies,
}); 