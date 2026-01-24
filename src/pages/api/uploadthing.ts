import { uploadRouter } from "@/server/uploadthing";
import { createRouteHandler } from "uploadthing/server";

const handlers = createRouteHandler({
  router: uploadRouter,
  config: {
    token: import.meta.env.UPLOADTHING_TOKEN,
  },
});

export { handlers as GET, handlers as POST };
