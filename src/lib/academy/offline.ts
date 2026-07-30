export function registerAcademyOfflineSupport(): void {
  if (
    !import.meta.env.PROD
    || typeof window === "undefined"
    || "__TAURI_INTERNALS__" in window
    || !("serviceWorker" in navigator)
    || !/^https?:$/.test(window.location.protocol)
  ) {
    return;
  }

  const serviceWorkerUrl = `${import.meta.env.BASE_URL}academy-service-worker.js`;
  void navigator.serviceWorker.register(serviceWorkerUrl, {
    scope: import.meta.env.BASE_URL
  }).catch(() => {
    // The native academy remains usable when service-worker registration is
    // unavailable. Offline readiness is verified separately in browser tests.
  });
}
