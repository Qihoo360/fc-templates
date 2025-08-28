import { StatsigClient } from '@statsig/js-client';
import { StatsigSessionReplayPlugin } from '@statsig/session-replay';
import { StatsigAutoCapturePlugin } from '@statsig/web-analytics';
import Cookie from 'js-cookie';
import { UID_COOKIE } from '@refly/utils';

let statsigClient: StatsigClient | null = null;

export const setupStatsig = async () => {
  const clientKey = process.env.VITE_STATSIG_CLIENT_KEY;
  if (!clientKey) {
    console.warn('VITE_STATSIG_CLIENT_KEY is not set, skipping statsig setup');
    return;
  }

  statsigClient = new StatsigClient(
    clientKey,
    { userID: Cookie.get(UID_COOKIE) },
    {
      environment: { tier: process.env.NODE_ENV },
      plugins: [new StatsigSessionReplayPlugin(), new StatsigAutoCapturePlugin()],
    },
  );

  await statsigClient.initializeAsync();
  console.log(`statsig initialized for env: ${process.env.NODE_ENV}`);
};

export const logEvent = (
  eventName: string,
  value?: string | number | null,
  metadata?: Record<string, any>,
) => {
  if (!statsigClient) {
    return;
  }

  statsigClient.logEvent(eventName, value ?? undefined, metadata);
};
