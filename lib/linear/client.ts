import { prisma } from "@/lib/prisma";

const LINEAR_GRAPHQL_ENDPOINT = "https://api.linear.app/graphql";

/** The Linear access token Better Auth stored on the user's linked account. */
export async function getLinearToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, providerId: "linear" },
    select: { accessToken: true },
  });
  return account?.accessToken ?? null;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: unknown;
}

/**
 * Execute a GraphQL query against the Linear API on behalf of a user.
 * OAuth tokens require the "Bearer " prefix. Throws on transport or GraphQL errors.
 */
export async function linearGraphQL<T>(
  token: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(LINEAR_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors) {
    throw new Error(`Linear GraphQL error: ${JSON.stringify(json.errors)}`);
  }
  return json.data as T;
}
