import { Router } from 'express';

/**
 * Liveness and readiness probes. `/health` reports the process is up;
 * `/ready` is where dependency checks (DB, queues) would be wired in.
 */
export function buildHealthRouter(): Router {
  const router = Router();
  const startedAt = Date.now();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000) });
  });

  router.get('/ready', (_req, res) => {
    res.json({ status: 'ready' });
  });

  return router;
}
