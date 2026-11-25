import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { candidateExport } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "candidate") return new NextResponse("Not allowed", { status: 403 });
  const data = candidateExport(user.id);
  if (data.user) delete (data.user as { password_hash?: string }).password_hash;
  return NextResponse.json(data);
}
