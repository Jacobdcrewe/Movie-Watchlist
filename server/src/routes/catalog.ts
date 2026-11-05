import { Router } from 'express';
import { z } from 'zod';
import type { CatalogService } from '../services/catalog';
import { asyncHandler, idSchema, parse, regionSchema } from './validation';

const regionQuery = z.object({ region: regionSchema.default('CA') });
const searchQuery = regionQuery.extend({ q: z.string().trim().max(200).default('') });

export function catalogRouter(catalog: CatalogService) {
  const r = Router();

  r.get(
    '/search',
    asyncHandler(async (req, res) => {
      const { q, region } = parse(searchQuery, req.query);
      res.json(q ? await catalog.search(q, region) : await catalog.trending(region));
    }),
  );

  r.get(
    '/trending',
    asyncHandler(async (req, res) => {
      const { region } = parse(regionQuery, req.query);
      res.json(await catalog.trending(region));
    }),
  );

  r.get(
    '/movies/:id',
    asyncHandler(async (req, res) => {
      const id = parse(idSchema, req.params.id);
      const { region } = parse(regionQuery, req.query);
      res.json(await catalog.details(id, region));
    }),
  );

  r.get(
    '/providers',
    asyncHandler(async (req, res) => {
      const { region } = parse(regionQuery, req.query);
      res.json(await catalog.providers(region));
    }),
  );

  return r;
}
