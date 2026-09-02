import { z } from "zod";

/**
 * Pusher channel authentication payload schema
 */
export const pusherAuthPayloadSchema = z.object({
  socket_id: z
    .string()
    .min(1, "Socket ID is required")
    .regex(/^\d+\.\d+$/, "Invalid socket_id format"),
  channel_name: z.string().min(1, "Channel name is required"),
});

export type PusherAuthPayload = z.infer<typeof pusherAuthPayloadSchema>;

export type ParsedChannel =
  | { type: "presence-workspace"; workspaceId: string }
  | { type: "private-board"; boardId: string }
  | { type: "unknown"; raw: string };

/**
 * Parses a channel name into its type and entity ID
 * Examples:
 * - "presence-workspace-ws-123" -> { type: "presence-workspace", workspaceId: "ws-123" }
 * - "private-board-board-456" -> { type: "private-board", boardId: "board-456" }
 */
export function parseChannelName(channelName: string): ParsedChannel {
  if (channelName.startsWith("presence-workspace-")) {
    const workspaceId = channelName.replace("presence-workspace-", "");
    if (workspaceId.length > 0) {
      return { type: "presence-workspace", workspaceId };
    }
  }

  if (channelName.startsWith("private-board-")) {
    const boardId = channelName.replace("private-board-", "");
    if (boardId.length > 0) {
      return { type: "private-board", boardId };
    }
  }

  return { type: "unknown", raw: channelName };
}
