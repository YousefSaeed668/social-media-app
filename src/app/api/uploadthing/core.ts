import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { createUploadthing, FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";

const f = createUploadthing();

export const fileRouter = {
  avatar: f({
    image: { maxFileSize: "512KB" },
  })
    .middleware(async () => {
      const { user } = await validateRequest();

      if (!user) throw new UploadThingError("Unauthorized");

      return { user };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const oldAvatarUrl = metadata.user.avatarUrl;
      if (oldAvatarUrl) {
        const key = oldAvatarUrl.split(
          `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`,
        )[1];

        await new UTApi().deleteFiles(key);
      }
      let newAvatarUrl = "";
      if (file.url.includes("11vd0fta0n.ufs.sh")) {
        newAvatarUrl = file.url.replace(
          "11vd0fta0n.ufs.sh/f/",
          `utfs.io/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`,
        );
      } else {
        newAvatarUrl = file.url.replace(
          "/f/",
          `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`,
        );
      }
      await Promise.all([
        prisma.user.update({
          where: { id: metadata.user.id },
          data: {
            avatarUrl: newAvatarUrl,
          },
        }),
        streamServerClient.partialUpdateUser({
          id: metadata.user.id,
          set: {
            image: newAvatarUrl,
          },
        }),
      ]);

      return { avatarUrl: newAvatarUrl };
    }),
  attachment: f({
    image: { maxFileSize: "4MB", maxFileCount: 5 },
    video: { maxFileSize: "64MB", maxFileCount: 5 },
  })
    .middleware(async () => {
      const { user } = await validateRequest();

      if (!user) throw new UploadThingError("Unauthorized");

      return {};
    })
    .onUploadComplete(async ({ file }) => {
      let fileUrl = "";
      if (file.url.includes("11vd0fta0n.ufs.sh")) {
        fileUrl = file.url.replace(
          "11vd0fta0n.ufs.sh/f/",
          `utfs.io/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`,
        );
      } else {
        fileUrl = file.url.replace(
          "/f/",
          `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`,
        );
      }
      const media = await prisma.media.create({
        data: {
          url: fileUrl,
          type: file.type.startsWith("image") ? "IMAGE" : "VIDEO",
        },
      });

      return { mediaId: media.id };
    }),
} satisfies FileRouter;

export type AppFileRouter = typeof fileRouter;
