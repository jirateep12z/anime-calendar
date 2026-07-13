import type { NextRequest } from 'next/server';

const JSON_CONTENT_TYPE = 'application/json';

export const MAX_MUTATION_BODY_BYTES = 8_192;

export class RequestSecurityError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'RequestSecurityError';
  }
}

export function IsTrustedOrigin(
  request_origin: string | null,
  expected_origin: string
): boolean {
  return request_origin === expected_origin;
}

export function ValidateMutationRequest(request: NextRequest): boolean {
  const content_type = request.headers
    .get('content-type')
    ?.split(';', 1)[0]
    .trim()
    .toLowerCase();

  const content_length_header = request.headers.get('content-length');
  const content_length =
    content_length_header === null ? null : Number(content_length_header);

  return (
    content_type === JSON_CONTENT_TYPE &&
    IsTrustedOrigin(request.headers.get('origin'), request.nextUrl.origin) &&
    (content_length === null ||
      (Number.isSafeInteger(content_length) &&
        content_length >= 0 &&
        content_length <= MAX_MUTATION_BODY_BYTES))
  );
}

export async function ReadJsonRequestBody(
  request: NextRequest
): Promise<unknown> {
  const request_body_text = await request.text();

  if (
    new TextEncoder().encode(request_body_text).byteLength >
    MAX_MUTATION_BODY_BYTES
  ) {
    throw new RequestSecurityError('Request body is too large');
  }

  try {
    return JSON.parse(request_body_text) as unknown;
  } catch {
    throw new RequestSecurityError('Request body is not valid JSON');
  }
}
