import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const payloadSchema = z.object({
  sessionId: z.string(),
  events: z.array(
    z.object({
      key: z.string(),
      timestamp: z.number(),
      expectedChar: z.string(),
      isMatch: z.boolean(),
      interKeyDelayMs: z.number().optional(),
      holdDurationMs: z.number().optional(),
      usedCorrection: z.boolean().optional(),
      wordIndex: z.number(),
      charIndex: z.number()
    })
  )
});

export async function POST(request: Request) {
  const payload = payloadSchema.parse(await request.json());
  if (!payload.events.length) return NextResponse.json({ ok: true });

  await db.keystrokeEvent.createMany({
    data: payload.events.map((event) => ({
      sessionId: payload.sessionId,
      ...event
    }))
  });

  return NextResponse.json({ ok: true });
}
