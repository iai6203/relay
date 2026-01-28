import { EventPublisher } from "@orpc/server";

import type { PermissionResponse } from "./types";

export const permissionBus = new EventPublisher<
  Record<string, PermissionResponse>
>();
