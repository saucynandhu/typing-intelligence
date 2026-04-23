import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: { sessionId: string } }) {
  const session = await db.typingSession.findUnique({
    where: { id: params.sessionId },
    include: {
      events: {
        orderBy: { timestamp: "asc" }
      }
    }
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json(session);
}
