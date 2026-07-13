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

  public constructor(
    error_code: AniListErrorCode,
    message: string,
    http_status: number | null = null
  ) {
    super(message);
    this.name = 'AniListRequestError';
    this.error_code = error_code;
    this.http_status = http_status;
  }
}
