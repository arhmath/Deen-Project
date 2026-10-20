import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Readiness: dependency penting (Firestore) bisa dijangkau. */
export async function GET() {
  try {
    await Promise.race([
      db().collection("_health").doc("ping").get(),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 4000)),
    ]);
    return NextResponse.json({ status: "ready", dependencies: { firestore: "ok" } });
  } catch {
    return NextResponse.json({ status: "not_ready", dependencies: { firestore: "unavailable" } }, { status: 503 });
  }
}
