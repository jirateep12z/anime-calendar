'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore
} from 'react';

import type { ReactNode } from 'react';
import type {
  BeforeInstallPromptEvent,
  PwaInstallStatus,
  PwaState
} from '../types/pwa';

const SKIP_WAITING_EVENT_NAME = 'SKIP_WAITING';

export const PwaContext = createContext<PwaState | null>(null);

interface PwaProviderProps {
  readonly children: ReactNode;
}

function IsStandaloneDisplayMode(): boolean {
  return (
    (typeof window.matchMedia === 'function' &&
      window.matchMedia('(display-mode: standalone)').matches) ||
    ('standalone' in navigator && navigator.standalone === true)
  );
}

function IsIosBrowser(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function ReadInitialInstallStatus(): PwaInstallStatus {
  if (typeof window === 'undefined') {
    return 'UNAVAILABLE';
  }

  if (IsStandaloneDisplayMode()) {
    return 'INSTALLED';
  }

  if (IsIosBrowser()) {
    return 'IOS_GUIDANCE';
  }

  return 'UNAVAILABLE';
}

function SubscribeOnlineStatus(HandleStatusChange: () => void): () => void {
  window.addEventListener('online', HandleStatusChange);
  window.addEventListener('offline', HandleStatusChange);

  return () => {
    window.removeEventListener('online', HandleStatusChange);
    window.removeEventListener('offline', HandleStatusChange);
  };
}

function ReadOnlineStatus(): boolean {
  return navigator.onLine;
}

function ReadServerOnlineStatus(): boolean {
  return true;
}

export function PwaProvider({ children }: PwaProviderProps) {
  const is_online = useSyncExternalStore(
    SubscribeOnlineStatus,
    ReadOnlineStatus,
    ReadServerOnlineStatus
  );
  const [install_status, set_install_status] = useState<PwaInstallStatus>(
    ReadInitialInstallStatus
  );
  const [install_prompt, set_install_prompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [waiting_worker, set_waiting_worker] = useState<ServiceWorker | null>(
    null
  );

  useEffect(() => {
    function HandleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      set_install_prompt(event as BeforeInstallPromptEvent);
      set_install_status('AVAILABLE');
    }

    function HandleAppInstalled() {
      set_install_prompt(null);
      set_install_status('INSTALLED');
    }

    window.addEventListener('beforeinstallprompt', HandleBeforeInstallPrompt);
    window.addEventListener('appinstalled', HandleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        HandleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', HandleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' ||
      !('serviceWorker' in navigator)
    ) {
      return;
    }

    let is_effect_active = true;
    let worker_registration: ServiceWorkerRegistration | null = null;

    function HandleWorkerStateChange() {
      if (
        is_effect_active &&
        worker_registration?.installing?.state === 'installed' &&
        navigator.serviceWorker.controller
      ) {
        set_waiting_worker(worker_registration.waiting);
      }
    }

    function HandleUpdateFound() {
      worker_registration?.installing?.addEventListener(
        'statechange',
        HandleWorkerStateChange
      );
    }

    async function RegisterServiceWorker() {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });

        if (!is_effect_active) {
          return;
        }

        worker_registration = registration;
        set_waiting_worker(registration.waiting);
        registration.addEventListener('updatefound', HandleUpdateFound);
      } catch {
        // หน้าเว็บยังใช้งานแบบปกติได้เมื่อ browser ปิดกั้น service worker
      }
    }

    void RegisterServiceWorker();

    return () => {
      is_effect_active = false;
      worker_registration?.removeEventListener(
        'updatefound',
        HandleUpdateFound
      );
      worker_registration?.installing?.removeEventListener(
        'statechange',
        HandleWorkerStateChange
      );
    };
  }, []);

  const InstallPwa = useCallback(async (): Promise<boolean> => {
    if (install_prompt === null) {
      return false;
    }

    await install_prompt.prompt();
    const { outcome } = await install_prompt.userChoice;

    set_install_prompt(null);
    if (outcome === 'accepted') {
      set_install_status('INSTALLED');

      return true;
    }

    set_install_status(ReadInitialInstallStatus());

    return false;
  }, [install_prompt]);

  const ApplyPwaUpdate = useCallback(() => {
    if (waiting_worker === null) {
      return;
    }

    function HandleControllerChange() {
      window.location.reload();
    }

    navigator.serviceWorker.addEventListener(
      'controllerchange',
      HandleControllerChange,
      { once: true }
    );
    waiting_worker.postMessage({ event_name: SKIP_WAITING_EVENT_NAME });
    set_waiting_worker(null);
  }, [waiting_worker]);

  const pwa_state = useMemo<PwaState>(
    () =>
      Object.freeze({
        is_online,
        install_status,
        is_update_waiting: waiting_worker !== null,
        InstallPwa,
        ApplyPwaUpdate
      }),
    [ApplyPwaUpdate, InstallPwa, install_status, is_online, waiting_worker]
  );

  return (
    <PwaContext.Provider value={pwa_state}>{children}</PwaContext.Provider>
  );
}
