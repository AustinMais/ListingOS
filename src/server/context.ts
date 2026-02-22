import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { prisma } from '@/lib/db';

export async function createContext(opts: FetchCreateContextFnOptions) {
  return {
    prisma,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
