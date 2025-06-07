import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function deleteUploadThingFiles(fileUrls: string[] | null): Promise<void> {
  if (!fileUrls || fileUrls.length === 0) {
    return;
  }

  try {
    // Extract file keys from URLs
    // UploadThing URLs are in format: https://utfs.io/f/{fileKey}
    const fileKeys = fileUrls
      .map(url => {
        const match = url.match(/\/f\/([^/?]+)/);
        return match ? match[1] : null;
      })
      .filter(key => key !== null) as string[];

    if (fileKeys.length === 0) return;

    const result = await utapi.deleteFiles(fileKeys);

    if (!result.success) {
      console.error('Failed to delete some files from UploadThing:', result);
    }
  } catch (error) {
    console.error('Error deleting files from UploadThing:', error);
    // Don't throw the error to prevent tweet deletion from failing
    // if UploadThing deletion fails
  }
}