export type AniListErrorCode =
  | 'NETWORK'
  | 'SERVER'
  | 'CLIENT'
  | 'RATE_LIMIT'
  | 'GRAPHQL'
  | 'INVALID_RESPONSE'
  | 'PAGINATION_LIMIT';

export class AniListRequestError extends Error {
  public readonly error_code: AniListErrorCode;
  public readonly http_status: number | null;
  public readonly retry_at_milliseconds: number | null;

  public constructor(
    error_code: AniListErrorCode,
    message: string,
    http_status: number | null = null,
    retry_at_milliseconds: number | null = null
  ) {
    super(message);
    this.name = 'AniListRequestError';
    this.error_code = error_code;
    this.http_status = http_status;
    this.retry_at_milliseconds = retry_at_milliseconds;
  }
}
