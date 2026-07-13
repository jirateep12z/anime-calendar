'use client';

import { useContext } from 'react';

import { NotificationContext } from '../providers/notification-provider';

import type { NotificationContextValue } from '../types/notification';

export function UseNotifications(): NotificationContextValue {
  const notification_context = useContext(NotificationContext);

  if (notification_context === null) {
    throw new Error(
      'UseNotifications must be used within NotificationProvider.'
    );
  }

  return notification_context;
}
