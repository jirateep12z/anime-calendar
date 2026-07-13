export interface AuthenticatedDevice {
  readonly device_id: string;
  readonly session_token_hash: string;
}
