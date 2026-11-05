import { Router } from 'express';
import { z } from 'zod';
import type { SettingsService } from '../services/watchlist';
import { parse, regionSchema } from './validation';

const settingsBody = z
  .object({
    region: regionSchema.optional(),
    myServices: z.array(z.number().int().positive()).max(100).optional(),
    theme: z.enum(['dark', 'light']).optional(),
  })
  .strict();

export function settingsRouter(settings: SettingsService) {
  const r = Router();
  r.get('/', (_req, res) => {
    res.json(settings.get());
  });
  r.put('/', (req, res) => {
    res.json(settings.update(parse(settingsBody, req.body)));
  });
  return r;
}
