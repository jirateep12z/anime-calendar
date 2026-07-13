import {
  NotificationBatchNotClaimableError,
  NotificationBatchNotFoundError,
} from "./production-dependencies.ts";
import {
  type NotificationBatchDependencies,
  SendNotificationBatch,
} from "./send-notification-batch.ts";

const MAX_REQUEST_BODY_BYTES = 1_024;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface NotificationBatchHandlerDependencies {
  readonly notification_edge_secret: string;
  readonly CreateBatchDependencies: () => Promise<
    NotificationBatchDependencies
  >;
}

function CreateJsonResponse(response_body: unknown, status: number): Response {
  return Response.json(response_body, { status });
}

function CreateInvalidRequestResponse(): Response {
  return CreateJsonResponse(
    {
      data: null,
      error: { code: "INVALID_REQUEST", message: "Invalid batch" },
    },
    400,
  );
}

function ParseBatchId(request_body: unknown): string | null {
  if (
    typeof request_body !== "object" ||
    request_body === null ||
    Array.isArray(request_body) ||
    Object.keys(request_body).length !== 1 ||
    !("batch_id" in request_body) ||
    typeof request_body.batch_id !== "string" ||
    !UUID_PATTERN.test(request_body.batch_id)
  ) {
    return null;
  }
  return request_body.batch_id;
}

export async function HandleNotificationBatchRequest(
  request: Request,
  dependencies: NotificationBatchHandlerDependencies,
): Promise<Response> {
  if (
    request.method !== "POST" ||
    request.headers.get("authorization") !==
      `Bearer ${dependencies.notification_edge_secret}`
  ) {
    return CreateJsonResponse(
      { data: null, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      401,
    );
  }

  const request_body_text = await request.text();
  if (
    new TextEncoder().encode(request_body_text).byteLength >
      MAX_REQUEST_BODY_BYTES
  ) {
    return CreateInvalidRequestResponse();
  }

  let request_body: unknown;
  try {
    request_body = JSON.parse(request_body_text) as unknown;
  } catch {
    return CreateInvalidRequestResponse();
  }
  const batch_id = ParseBatchId(request_body);
  if (batch_id === null) {
    return CreateInvalidRequestResponse();
  }

  try {
    const batch_dependencies = await dependencies.CreateBatchDependencies();
    const batch_result = await SendNotificationBatch(
      batch_id,
      batch_dependencies,
    );
    return CreateJsonResponse({ data: batch_result, error: null }, 200);
  } catch (error) {
    if (error instanceof NotificationBatchNotFoundError) {
      return CreateJsonResponse(
        {
          data: null,
          error: { code: "NOT_FOUND", message: "Batch not found" },
        },
        404,
      );
    }
    if (error instanceof NotificationBatchNotClaimableError) {
      return CreateJsonResponse(
        {
          data: null,
          error: { code: "NOT_CLAIMABLE", message: "Batch not claimable" },
        },
        409,
      );
    }
    console.error({
      event_name: "NOTIFICATION_BATCH_FAILED",
      error_name: error instanceof Error ? error.name : "UnknownError",
    });
    return CreateJsonResponse(
      {
        data: null,
        error: { code: "SERVICE_UNAVAILABLE", message: "Batch failed" },
      },
      503,
    );
  }
}
