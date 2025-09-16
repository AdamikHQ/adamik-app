/**
 * Utility to suppress CancelledError globally
 * This adds event listeners early to catch and suppress these errors
 */

if (typeof window !== "undefined") {
  // Add handlers at the earliest possible point
  window.addEventListener(
    "unhandledrejection",
    (event: PromiseRejectionEvent) => {
      if (
        event.reason?.name === "CancelledError" ||
        event.reason?.message?.includes("CancelledError") ||
        event.reason?.toString?.()?.includes("CancelledError")
      ) {
        event.preventDefault();
        event.stopPropagation();
        console.debug("Early suppression of CancelledError:", event.reason);
        return false;
      }
    },
    true // Use capture phase
  );

  window.addEventListener(
    "error",
    (event: ErrorEvent) => {
      if (
        event.error?.name === "CancelledError" ||
        event.message?.includes("CancelledError") ||
        event.error?.toString?.()?.includes("CancelledError")
      ) {
        event.preventDefault();
        event.stopPropagation();
        console.debug("Early suppression of CancelledError:", event.error);
        return false;
      }
    },
    true // Use capture phase
  );
}

export {};