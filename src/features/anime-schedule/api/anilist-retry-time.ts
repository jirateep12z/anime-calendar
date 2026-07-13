const MILLISECONDS_PER_SECOND = 1000;
const FALLBACK_RETRY_DELAY_MILLISECONDS = 60_000;
const HTTP_DATE_PATTERN =
  /^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT$/;

function ParseHttpDate(header: string): number {
  const date_milliseconds = Date.parse(header);

  return HTTP_DATE_PATTERN.test(header) &&
    new Date(date_milliseconds).toUTCString() === header
    ? date_milliseconds
    : Number.NaN;
}

export function ReadAniListRetryAt(
  retry_after: string | null,
  now_milliseconds = Date.now()
): number {
  const header = retry_after?.trim();
  const parsed_deadline =
    header !== undefined && /^\d+$/.test(header)
      ? now_milliseconds + Number(header) * MILLISECONDS_PER_SECOND
      : header !== undefined
        ? ParseHttpDate(header)
        : Number.NaN;

  return Number.isSafeInteger(parsed_deadline)
    ? Math.max(now_milliseconds, parsed_deadline)
    : now_milliseconds + FALLBACK_RETRY_DELAY_MILLISECONDS;
}
