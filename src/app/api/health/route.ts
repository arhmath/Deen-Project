import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Liveness: proses hidup. */
export function GET() {
  return NextResponse.json({ status: "ok", time: new Date().toISOString() });
}
