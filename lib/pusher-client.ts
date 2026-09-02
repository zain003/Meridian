import PusherClient from "pusher-js";

let pusherClientInstance: PusherClient | null = null;

/**
 * Returns a singleton Pusher-JS client for browser subscriptions.
 * Returns null if running on server or if NEXT_PUBLIC_PUSHER_KEY is not configured.
 */
export function getPusherClient(): PusherClient | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (pusherClientInstance) {
    return pusherClientInstance;
  }

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1";

  if (!key) {
    return null;
  }

  pusherClientInstance = new PusherClient(key, {
    cluster,
    authEndpoint: "/api/realtime/auth",
    auth: {
      headers: {},
    },
  });

  return pusherClientInstance;
}
