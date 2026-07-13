import { ApiClientError } from '@/lib/api/client';

export type NotificationClientErrorCode =
  | 'PERMISSION_DENIED'
  | 'PUSH_SUBSCRIPTION_FAILED'
  | 'PARTIAL_UNSUBSCRIBE_FAILED';

export class NotificationClientError extends ApiClientError<NotificationClientErrorCode> {
  public constructor(
    error_code: NotificationClientErrorCode,
    message: string,
    http_status: number | null = null,
    cause: unknown = null
  ) {
    super(error_code, message, http_status, cause);
    this.name = 'NotificationClientError';
  }
}
