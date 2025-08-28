import { Statsig, StatsigUser } from '@statsig/statsig-node-core';

let statsig: Statsig | null = null;

export const setupStatsig = async () => {
  const secretKey = process.env.STATSIG_SECRET_KEY;
  if (!secretKey) {
    console.warn('STATSIG_CLIENT_KEY is not set, skipping statsig setup');
    return;
  }

  statsig = new Statsig(secretKey, { environment: process.env.NODE_ENV });
  await statsig.initialize();

  console.log(`statsig initialized for env: ${process.env.NODE_ENV}`);
};

export const logEvent = (
  user: { uid: string; email?: string },
  eventName: string,
  value?: string | number,
  metadata?: Record<string, any>,
) => {
  if (!statsig) {
    return;
  }

  statsig.logEvent(
    new StatsigUser({ userID: user.uid, email: user.email }),
    eventName,
    value,
    metadata,
  );
};
