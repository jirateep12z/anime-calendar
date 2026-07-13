import 'server-only';

export {
  AuthorizeDeviceRequest,
  CreateDeviceRouteErrorResponse,
  DeviceRouteError
} from './server/device-route-security';
export {
  AuthenticateDevice,
  CreateDeviceSession,
  CreateDeviceToken,
  DEVICE_COOKIE_NAME,
  DEVICE_COOKIE_OPTIONS,
  DeviceSessionError,
  HashDeviceToken,
  type CreatedDeviceSession
} from './server/device-session';
