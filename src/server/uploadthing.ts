import { createUploadthing, type FileRouter } from "uploadthing/server";
import { auth } from "@/lib/auth";

const f = createUploadthing();

export const uploadRouter = {
  // Image uploader for products and categories
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      // Verify the user session using better-auth
      const session = await auth.api.getSession({
        headers: req.headers,
      });

      if (!session?.user) {
        throw new Error("Unauthorized");
      }

      return {
        userId: session.user.id,
        uploadedAt: new Date().toISOString(),
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for user:", metadata.userId);
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
