import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

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

  return NextResponse.json({ session });
}
