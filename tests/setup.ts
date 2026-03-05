/**
 * Global test setup — mocks the Drizzle DB module so unit tests run without
 * a live Postgres connection. Individual test files that need real DB behaviour
 * can override this mock with vi.mock() inside the file.
 */
import { vi } from "vitest";

// Mock the db module with a no-op returning empty results by default.
vi.mock("@/lib/db", () => {

  return {
    db: {
      select: () => ({
        from: () => ({
          where: () => [],
          orderBy: () => ({ limit: () => [] }),
          limit: () => [],
        }),
      }),
      insert: () => ({
        values: () => Promise.resolve(),
        onConflictDoNothing: () => Promise.resolve(),
        onConflictDoUpdate: () => Promise.resolve(),
      }),
      update: () => ({
        set: () => ({
          where: () => Promise.resolve(),
        }),
      }),
      delete: () => ({
        where: () => Promise.resolve(),
      }),
      execute: () => Promise.resolve({ rows: [] }),
      transaction: vi.fn(async (fn: (...args: unknown[]) => unknown) => fn({})),
    },
  };
});
