import Pusher from "pusher";
import { prisma } from "@/lib/prisma";
import { parseChannelName } from "@/lib/validations/realtime";

export interface SessionUser {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
}

export interface RealtimePresenceUser {
  userId: string;
  name: string;
  image?: string | null;
  activeBoardId?: string;
  activeTaskId?: string;
  lastSeenAt: number;
}

export interface PusherAuthResponse {
  auth: string;
  channel_data?: string;
  shared_secret?: string;
}

let pusherServerInstance: Pusher | null = null;

/**
 * Returns the server-side Pusher client instance.
 * Returns null if Pusher environment variables are not configured.
 */
export function getPusherServer(): Pusher | null {
  if (pusherServerInstance) {
    return pusherServerInstance;
  }

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY || process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER || process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1";

  if (!appId || !key || !secret) {
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        "[Pusher] Missing server credentials (PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET). Real-time events will be simulated."
      );
    }
    return null;
  }

  pusherServerInstance = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });

  return pusherServerInstance;
}

export class RealtimeAuthError extends Error {
  status: number;
  constructor(message: string, status: number = 400) {
    super(message);
    this.name = "RealtimeAuthError";
    this.status = status;
  }
}

/**
 * Authorizes a user for a specific presence or private channel.
 * Enforces workspace membership verification in PostgreSQL before minting auth tokens.
 */
export async function authorizePusherChannel(
  user: SessionUser | null | undefined,
  socketId: string,
  channelName: string
): Promise<PusherAuthResponse> {
  if (!user?.id) {
    throw new RealtimeAuthError("Unauthorized: Session required", 401);
  }

  if (!socketId || !channelName) {
    throw new RealtimeAuthError("Bad Request: socket_id and channel_name required", 400);
  }

  const parsed = parseChannelName(channelName);

  if (parsed.type === "unknown") {
    throw new RealtimeAuthError(
      `Bad Request: Unsupported or malformed channel name '${channelName}'`,
      400
    );
  }

  if (parsed.type === "presence-workspace") {
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: parsed.workspaceId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      throw new RealtimeAuthError(
        "Forbidden: You are not a member of this workspace",
        403
      );
    }

    const presenceData = {
      user_id: user.id,
      user_info: {
        name: user.name || user.email.split("@")[0],
        email: user.email,
        image: user.image || null,
      },
    };

    const pusher = getPusherServer();
    if (!pusher) {
      // Development fallback mock token
      return {
        auth: `mock-key:presence-mock-auth-${user.id}`,
        channel_data: JSON.stringify(presenceData),
      };
    }

    return pusher.authorizeChannel(socketId, channelName, presenceData);
  }

  if (parsed.type === "private-board") {
    const board = await prisma.board.findUnique({
      where: { id: parsed.boardId },
      select: {
        id: true,
        project: {
          select: {
            workspaceId: true,
          },
        },
      },
    });

    if (!board) {
      throw new RealtimeAuthError("Not Found: Board does not exist", 404);
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: board.project.workspaceId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      throw new RealtimeAuthError(
        "Forbidden: You do not have access to this board's workspace",
        403
      );
    }

    const pusher = getPusherServer();
    if (!pusher) {
      return {
        auth: `mock-key:private-mock-auth-${user.id}`,
      };
    }

    return pusher.authorizeChannel(socketId, channelName);
  }

  throw new RealtimeAuthError("Bad Request: Invalid channel type", 400);
}

/**
 * Triggers a real-time event on a Pusher channel.
 * Gracefully swallows network/API errors so backend actions don't fail.
 */
export async function triggerPusherEvent(
  channel: string,
  event: string,
  data: unknown
): Promise<void> {
  const pusher = getPusherServer();
  if (!pusher) return;

  try {
    await pusher.trigger(channel, event, data);
  } catch (err) {
    console.error(`[Pusher] Failed to trigger event '${event}' on channel '${channel}':`, err);
  }
}
