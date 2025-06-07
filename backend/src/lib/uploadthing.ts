import { createUploadthing, type FileRouter } from "uploadthing/server";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const uploadFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  tweetImageUploader: f({
    image: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: "2MB",
      maxFileCount: 4, // Allow up to 4 images per tweet
    },
  })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      // For now, we'll allow all uploads - you can add auth logic here later
      // In a real app, you'd extract the user from the request headers
      
      // Extract user info from headers if available
      const authHeader = req.headers.get('authorization');
      // You can implement proper auth validation here
      
      // For now, return a basic metadata object
      return { 
        userId: "authenticated-user", // This should come from your auth system
        uploadedAt: new Date().toISOString(),
        fileType: "image"
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.ufsUrl);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { 
        type: metadata.fileType,
        mimeType: file.type,
      };
    }),

  tweetDocumentUploader: f({
    "application/pdf": { maxFileSize: "2MB", maxFileCount: 4 },
    // "application/msword": { maxFileSize: "16MB", maxFileCount: 4 },
    // "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "16MB", maxFileCount: 4 },
    // "application/vnd.ms-excel": { maxFileSize: "16MB", maxFileCount: 4 },
    // "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { maxFileSize: "16MB", maxFileCount: 4 },
    // "application/vnd.ms-powerpoint": { maxFileSize: "16MB", maxFileCount: 4 },
    // "application/vnd.openxmlformats-officedocument.presentationml.presentation": { maxFileSize: "16MB", maxFileCount: 4 },
    // "text/plain": { maxFileSize: "16MB", maxFileCount: 4 },
    // "text/csv": { maxFileSize: "16MB", maxFileCount: 4 },
  })
    .middleware(async ({ req }) => {
      const authHeader = req.headers.get('authorization');
      
      return { 
        userId: "authenticated-user",
        uploadedAt: new Date().toISOString(),
        fileType: "document"
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Document upload complete for userId:", metadata.userId);
      console.log("file url", file.ufsUrl);

      return { 
        type: metadata.fileType,
        mimeType: file.type,
      };
    }),
} satisfies FileRouter;

export type UploadFileRouter = typeof uploadFileRouter; 