import { Router } from 'express';
import { z } from 'zod';
import type { SettingsService, WatchlistService } from '../services/watchlist';
import { asyncHandler, HttpError, idSchema, parse, regionSchema } from './validation';

const regionQuery = z.object({ region: regionSchema.optional() });
const addBody = z.object({ tmdbId: idSchema });
const patchBody = z
  .object({
    watched: z.boolean().optional(),
    rating: z.number().int().min(0).max(5).optional(),
    note: z.string().max(5000).optional(),
  })
  .strict();

export function watchlistRouter(watchlist: WatchlistService, settings: SettingsService) {
  const r = Router();
  const regionOf = (query: unknown) => parse(regionQuery, query).region ?? settings.get().region;

  r.get(
    '/',
    asyncHandler(async (req, res) => {
      res.json(await watchlist.list(regionOf(req.query)));
    }),
  );

  r.post(
    '/',
    asyncHandler(async (req, res) => {
      const { tmdbId } = parse(addBody, req.body);
      const existed = watchlist.has(tmdbId);
      const entry = await watchlist.add(tmdbId, regionOf(req.query));
      res.status(existed ? 200 : 201).json(entry);
    }),
  );

  r.patch(
    '/:id',
    asyncHandler(async (req, res) => {
      const id = parse(idSchema, req.params.id);
      const patch = parse(patchBody, req.body);
      if (!watchlist.update(id, patch)) throw new HttpError(404, 'Not in watchlist');
      res.json(await watchlist.get(id, regionOf(req.query)));
    }),
  );

  r.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const id = parse(idSchema, req.params.id);
      if (!watchlist.remove(id)) throw new HttpError(404, 'Not in watchlist');
      res.status(204).end();
    }),
  );

  return r;
}
