/// <reference lib="deno.ns" />

import {
  CreateProductionDependencies,
  ReadEdgeEnvironment,
} from "./production-dependencies.ts";
import { HandleNotificationBatchRequest } from "./notification-batch-handler.ts";

const environment = ReadEdgeEnvironment();

Deno.serve((request) =>
  HandleNotificationBatchRequest(request, {
    notification_edge_secret: environment.notification_edge_secret,
    CreateBatchDependencies: () => CreateProductionDependencies(environment),
  })
);
