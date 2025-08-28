import { IconCopy } from '@refly-packages/ai-workspace-common/components/common/icon';

import React from 'react';
import { Button, notification } from 'antd';
import { LOCALE } from '@refly/common-types';
import {
  ActionResultNotFoundError,
  AuthenticationExpiredError,
  getErrorMessage,
} from '@refly/errors';

import { UnknownError } from '@refly/errors';
import { BaseResponse } from '@refly/openapi-schema';
import { logEvent } from '@refly/telemetry-web';

const errTitle = {
  en: 'Oops, something went wrong',
  'zh-CN': '哎呀，出错了',
};

const ignoredErrorCodes = [
  new ActionResultNotFoundError().code,
  new AuthenticationExpiredError().code, // Don't show notifications for auth errors
];

// Track shown error notifications with a Map of error codes to timestamps
// This allows us to prevent showing the same error multiple times in a short period
const shownErrorNotifications = new Map<string, number>();
const ERROR_COOLDOWN_MS = 5000; // Only show the same error once per 5 seconds

// Reset error notification tracking periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  // Remove entries older than 1 hour to prevent memory leaks
  for (const [code, timestamp] of shownErrorNotifications.entries()) {
    if (now - timestamp > 3600000) {
      // 1 hour
      shownErrorNotifications.delete(code);
    }
  }
}, 300000); // Clean up every 5 minutes

export const showErrorNotification = (res: BaseResponse, locale: LOCALE) => {
  const { errCode, traceId, stack } = res;

  // Don't log or show if no error code (likely not an actual error)
  if (!errCode) {
    return;
  }

  logEvent('global::error_notification', errCode, { traceId });

  // Don't show ignored error codes
  if (ignoredErrorCodes.includes(errCode)) {
    return;
  }

  // Check if we've shown this error recently
  const now = Date.now();
  const lastShown = shownErrorNotifications.get(errCode);
  if (lastShown && now - lastShown < ERROR_COOLDOWN_MS) {
    // Skip showing this notification as it was shown recently
    return;
  }

  // Update the timestamp for this error code
  shownErrorNotifications.set(errCode, now);

  const isUnknownError = !errCode || errCode === new UnknownError().code;
  const errMsg = getErrorMessage(errCode, locale);

  const description = React.createElement(
    'div',
    null,
    React.createElement(
      'div',
      {
        style: { fontSize: 14 },
      },
      errMsg,
    ),
    isUnknownError &&
      stack &&
      React.createElement(
        'pre',
        {
          style: {
            fontSize: 12,
            overflow: 'auto',
            marginTop: 8,
            border: '1px solid #eee',
            borderRadius: 8,
            padding: '10px 16px',
            color: 'black',
            backgroundColor: '#eee',
          },
        },
        stack,
      ),
    traceId &&
      React.createElement(
        'div',
        {
          style: {
            marginTop: 8,
            fontSize: 11,
            color: '#666',
            display: 'flex',
            alignItems: 'center',
          },
        },
        React.createElement('div', null, `Trace ID: ${traceId}`),
        React.createElement(
          Button,
          {
            type: 'link',
            size: 'small',
            onClick: () => {
              navigator.clipboard.writeText(traceId);
              notification.success({
                message: locale === 'zh-CN' ? '已复制' : 'Copied',
                duration: 2,
              });
            },
          },
          React.createElement(IconCopy, { style: { fontSize: 14, color: '#666' } }),
        ),
      ),
  );

  notification.error({
    message: errTitle[locale],
    description,
    duration: isUnknownError ? -1 : 5,
    key: `error-${errCode}`, // Use a key to prevent duplicate notifications
  });
};

// Export for testing purposes
export const _resetErrorNotifications = () => {
  shownErrorNotifications.clear();
};
