'use client';

import { z } from 'zod';

import { CreateJsonMutation, RequestApi } from '@/lib/api/client';
import { CreateSingleFlight } from '../services/create-single-flight';

const DeviceSessionResponseSchema = z.strictObject({
  device_id: z.uuid()
});

const RequestDeviceSession = CreateSingleFlight(async () => {
  const response = await RequestApi(
    '/api/device-session',
    DeviceSessionResponseSchema,
    CreateJsonMutation('POST', {})
  );

  return response.device_id;
});

export function EnsureDeviceSession(): Promise<string> {
  return RequestDeviceSession();
}
