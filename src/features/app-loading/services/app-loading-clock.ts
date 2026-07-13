export function GetAppLoadingTime() {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}
