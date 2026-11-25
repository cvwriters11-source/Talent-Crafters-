import { NextResponse } from "next/server";
import { discoveryTick } from "@/lib/discovery";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  if (!secret || header !== `Bearer ${secret}`) return new NextResponse("Not allowed", { status: 401 });
  await discoveryTick();
  return NextResponse.json({ ok: true });
}
