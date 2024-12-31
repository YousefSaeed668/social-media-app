"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
import {
  UpdateUserProfileSchema,
  UpdateUserProfileValues,
} from "@/lib/validation";

export async function updateUserProfile(values: UpdateUserProfileValues) {
  const validatedValues = UpdateUserProfileSchema.parse(values);
  const { user } = await validateRequest();
  if (!user) {
    throw new Error("Unauthorized");
  }
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: validatedValues,

    select: getUserDataSelect(user.id),
  });
  return updatedUser;
}
