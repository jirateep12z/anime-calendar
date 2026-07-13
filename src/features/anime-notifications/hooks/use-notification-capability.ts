'use client';

import { useSyncExternalStore } from 'react';

import type { NotificationCapabilityStatus } from '../types/notification';

export interface NotificationCapabilityInput {
  readonly has_notification_api: boolean;
  readonly has_service_worker: boolean;
  readonly has_push_manager: boolean;
  readonly permission: NotificationPermission;
  readonly is_ios: boolean;
  readonly is_standalone: boolean;
}

export function CalculateNotificationCapability(
  capability_input: NotificationCapabilityInput
): NotificationCapabilityStatus {
  if (
    !capability_input.has_notification_api ||
    !capability_input.has_service_worker ||
    !capability_input.has_push_manager
  ) {
    return 'UNSUPPORTED';
  }

  if (capability_input.is_ios && !capability_input.is_standalone) {
    return 'IOS_INSTALL_REQUIRED';
  }

  if (capability_input.permission === 'denied') {
    return 'PERMISSION_DENIED';
  }

  return 'SUPPORTED';
}

function IsIosBrowser(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function IsStandaloneDisplayMode(): boolean {
  return (
    (typeof window.matchMedia === 'function' &&
      window.matchMedia('(display-mode: standalone)').matches) ||
    ('standalone' in navigator && navigator.standalone === true)
  );
}

function ReadCapabilityStatus(): NotificationCapabilityStatus {
  return CalculateNotificationCapability({
    has_notification_api: 'Notification' in window,
    has_service_worker: 'serviceWorker' in navigator,
    has_push_manager: 'PushManager' in window,
    permission: 'Notification' in window ? Notification.permission : 'default',
    is_ios: IsIosBrowser(),
    is_standalone: IsStandaloneDisplayMode()
  });
}

function ReadServerCapabilityStatus(): NotificationCapabilityStatus {
  return 'UNSUPPORTED';
}

function SubscribeCapabilityStatus(HandleStatusChange: () => void): () => void {
  window.addEventListener('focus', HandleStatusChange);
  document.addEventListener('visibilitychange', HandleStatusChange);

  return () => {
    window.removeEventListener('focus', HandleStatusChange);
    document.removeEventListener('visibilitychange', HandleStatusChange);
  };
}

export function UseNotificationCapability(): NotificationCapabilityStatus {
  return useSyncExternalStore(
    SubscribeCapabilityStatus,
    ReadCapabilityStatus,
    ReadServerCapabilityStatus
  );
}
