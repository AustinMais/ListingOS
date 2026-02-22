import { router } from '../trpc';
import { listingRouter } from './listing';

export const appRouter = router({
  listing: listingRouter,
});

export type AppRouter = typeof appRouter;
