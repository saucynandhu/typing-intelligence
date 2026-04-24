import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { spawn } from "node:child_process";
import path from "node:path";

const payloadSchema = z.object({
  sessionId: z.string(),
  wpm: z.number(),
  accuracy: z.number(),
  durationMs: z.number()
});

export async function POST(request: Request) {
  const payload = payloadSchema.parse(await request.json());

  const session = await db.typingSession.update({
    where: { id: payload.sessionId },
    data: {
      finishedAt: new Date(),
      totalWpm: payload.wpm,
      totalAccuracy: payload.accuracy,
      durationMs: payload.durationMs
    }
  });

  // Trigger the background pipeline to update models
  // We use spawn in a detached way to not block the response
  const pipelinePath = path.join(process.cwd(), "../../scripts/pipelines/run-all.js");
  const child = spawn("node", [pipelinePath], {
    detached: true,
    stdio: "ignore"
  });
  child.unref();

  return NextResponse.json({ session });
}
