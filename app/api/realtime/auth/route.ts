import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { authorizePusherChannel, RealtimeAuthError } from "@/lib/pusher";
import { pusherAuthPayloadSchema } from "@/lib/validations/realtime";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized: Active session required" },
        { status: 401 }
      );
    }

    let socketId: string | undefined;
    let channelName: string | undefined;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const json = await req.json().catch(() => ({}));
      socketId = json.socket_id;
      channelName = json.channel_name;
    } else {
      const formData = await req.formData().catch(() => new FormData());
      socketId = formData.get("socket_id")?.toString();
      channelName = formData.get("channel_name")?.toString();
    }

    const validation = pusherAuthPayloadSchema.safeParse({
      socket_id: socketId,
      channel_name: channelName,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const authResponse = await authorizePusherChannel(
      session.user,
      validation.data.socket_id,
      validation.data.channel_name
    );

    return NextResponse.json(authResponse);
  } catch (error) {
    if (error instanceof RealtimeAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("[Pusher Auth Route Error]:", error);
    return NextResponse.json(
      { error: "Internal server error during channel authorization" },
      { status: 500 }
    );
  }
}
