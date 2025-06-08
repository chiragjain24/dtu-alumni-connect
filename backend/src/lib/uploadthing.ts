import { HTTPException } from "hono/http-exception";
import { createUploadthing, type FileRouter } from "uploadthing/server";
import { auth } from "./auth";
// import { UploadThingError } from "uploadthing/server";

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
      // Authenticate user using BetterAuth
      const session = await auth.api.getSession({ headers: req.headers });
      
      if (!session || !session.user) {
        throw new HTTPException(401, { message: 'Unauthorized - Please log in to upload files' });
      }

      // Return metadata with actual user info
      return { 
        userId: session.user.id,
        uploadedAt: new Date().toISOString(),
        fileType: "image"
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { 
        type: metadata.fileType,
        mimeType: file.type,
        userId: metadata.userId,
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
      // Authenticate user using BetterAuth
      const session = await auth.api.getSession({ headers: req.headers });
      
      if (!session || !session.user) {
        throw new HTTPException(401, { message: 'Unauthorized - Please log in to upload documents' });
      }
      
      return { 
        userId: session.user.id,
        uploadedAt: new Date().toISOString(),
        fileType: "document"
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {

      return { 
        type: metadata.fileType,
        mimeType: file.type,
        userId: metadata.userId,
      };
    }),
} satisfies FileRouter;

export type UploadFileRouter = typeof uploadFileRouter; 