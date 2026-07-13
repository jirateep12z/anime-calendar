export type PwaInstallStatus =
  'INSTALLED' | 'AVAILABLE' | 'IOS_GUIDANCE' | 'UNAVAILABLE';

export interface PwaState {
  readonly is_online: boolean;
  readonly install_status: PwaInstallStatus;
  readonly is_update_waiting: boolean;
  readonly InstallPwa: () => Promise<boolean>;
  readonly ApplyPwaUpdate: () => void;
}

export interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<{ readonly outcome: 'accepted' | 'dismissed' }>;
  readonly prompt: () => Promise<void>;
}
