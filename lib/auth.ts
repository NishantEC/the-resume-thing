import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      // Public-data-first wedge: read profile/email + org membership.
      // `repo` (private contributions) is intentionally deferred.
      scope: ["read:user", "user:email", "read:org"],
    },
  },
  // Must remain last so Set-Cookie headers from server actions are applied.
  plugins: [nextCookies()],
});
