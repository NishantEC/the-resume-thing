import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "app/**/*.test.ts"],
    // Lets modules that transitively import the Prisma singleton load; the
    // pure tests here never issue a query.
    env: { DATABASE_URL: "file:./dev.db" },
  },
});
