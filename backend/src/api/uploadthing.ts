import { Hono } from 'hono';
import { createRouteHandler } from "uploadthing/server";
import { uploadFileRouter } from "../lib/uploadthing";

// Create the route handler using UploadThing's fetch adapter
const handlers = createRouteHandler({
  router: uploadFileRouter,
  config: {
    // Add any additional config here if needed
  },
});

const app = new Hono()
  .get('/', async (c) => {
    const request = c.req.raw;
    const response = await handlers(request);
    return response;
  })
  .post('/', async (c) => {
    const request = c.req.raw;
    const response = await handlers(request);
    return response;
  });

export { app as uploadthingRoute }; 