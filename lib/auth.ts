import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { genericOAuth } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";

const linearClientId = process.env.LINEAR_CLIENT_ID;
const linearClientSecret = process.env.LINEAR_CLIENT_SECRET;

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  // Allow linking a second provider (Linear) to a GitHub-authed user even when
  // the Linear email differs from the GitHub one.
  account: {
    accountLinking: { enabled: true, allowDifferentEmails: true },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      // Public-data-first wedge: read profile/email + org membership.
      // `repo` (private contributions) is intentionally deferred.
      scope: ["read:user", "user:email", "read:org"],
    },
  },
  plugins: [
    // Linear connect (genericOAuth) registers only when credentials exist, so the
    // app boots fine without them. Linear has no REST userinfo endpoint, so identity
    // comes from the GraphQL `viewer`; connecting LINKS it via authClient.oauth2.link.
    ...(linearClientId && linearClientSecret
      ? [
          genericOAuth({
            config: [
              {
                providerId: "linear",
                clientId: linearClientId,
                clientSecret: linearClientSecret,
                authorizationUrl: "https://linear.app/oauth/authorize",
                tokenUrl: "https://api.linear.app/oauth/token",
                scopes: ["read"],
                pkce: true,
                getUserInfo: async (tokens) => {
                  const res = await fetch("https://api.linear.app/graphql", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${tokens.accessToken}`,
                    },
                    body: JSON.stringify({ query: "{ viewer { id name email avatarUrl } }" }),
                  });
                  const body = (await res.json()) as {
                    data?: { viewer?: { id: string; name: string; email: string; avatarUrl?: string } };
                  };
                  const v = body.data?.viewer;
                  if (!v) return null;
                  return {
                    id: v.id,
                    name: v.name,
                    email: v.email,
                    emailVerified: true,
                    image: v.avatarUrl,
                  };
                },
              },
            ],
          }),
        ]
      : []),
    // Must remain last so Set-Cookie headers from server actions are applied.
    nextCookies(),
  ],
});
