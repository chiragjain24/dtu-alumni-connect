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
      maxFileSize: "4MB",
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
        uploadedAt: new Date().toISOString()
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { 
        uploadedBy: metadata.userId, 
        url: file.url,
        uploadedAt: metadata.uploadedAt
      };
    }),
} satisfies FileRouter;

export type UploadFileRouter = typeof uploadFileRouter; 