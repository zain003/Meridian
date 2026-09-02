import { NextResponse } from "next/server";
import { runQueueWorkerStep } from "@/lib/automation/worker";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is configured, require Bearer token
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const jobsProcessed = await runQueueWorkerStep();
    return NextResponse.json({
      success: true,
      jobsProcessed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Automation Cron] Worker error:", error);
    return NextResponse.json(
      { error: "Internal worker error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  return GET(req);
}
