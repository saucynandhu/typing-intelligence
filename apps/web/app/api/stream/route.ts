import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    realtime: "placeholder",
    note: "Upgrade to websocket transport and Redis-backed state in Phase 10."
  });
}
