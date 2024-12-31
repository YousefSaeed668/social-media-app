"use server";

import { lucia } from "@/auth";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { signUpSchema, SignUpValues } from "@/lib/validation";
import { hash } from "@node-rs/argon2";
import { generateIdFromEntropySize } from "lucia";
import { isRedirectError } from "next/dist/client/components/redirect";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
export async function signUp(
  credentials: SignUpValues,
): Promise<{ error: string }> {
  // we can't catch the errors in the front end

  try {
    // if the credentials are invalid, the parse method will throw an error that we can catch catch block
    const { email, username, password } = signUpSchema.parse(credentials);
    const passwordHash = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });
    const userId = generateIdFromEntropySize(10);
    const existingUsername = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
      },
    });
    if (existingUsername) {
      return {
        error: "Username is already taken",
      };
    }
    const existingEmail = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });
    if (existingEmail) {
      return {
        error: "Email is already taken",
      };
    }
    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          username,
          displayName: username,
          email,
          passwordHash,
        },
      });
      await streamServerClient.upsertUser({
        id: userId,
        username,
        name: username,
      });
    });

    const session = await lucia.createSession(userId, {});
    const sessionCookies = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookies.name,
      sessionCookies.value,
      sessionCookies.attributes,
    );
    return redirect("/");
  } catch (error) {
    // redirect function by default throw an error that caught by the catch block
    // and it will not work but to make it work we have to check if the error is a redirect error
    // and if it is then we have to throw the error so that the redirect function can work
    if (isRedirectError(error)) throw error;
    console.error(error);
    return {
      error: "Something went wrong. Please try again later.",
    };
  }
}
