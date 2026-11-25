import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { resolveCv } from "@/lib/files";
import { getApplication, getCandidate } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.status === "rejected") return new NextResponse("Sign in required", { status: 401 });
  const url = new URL(request.url);
  const ownerId = url.searchParams.get("user") || "";
  const applicationId = url.searchParams.get("application");
  const profile = getCandidate(ownerId);
  if (!profile?.cv_path) return new NextResponse("CV not found", { status: 404 });
  let allowed = user.id === ownerId || user.role === "admin" || user.role === "super_admin";
  if (!allowed && applicationId) {
    const application = getApplication(applicationId);
    allowed = Boolean(application && application.candidate_user_id === ownerId && application.owner_user_id === user.id);
  }
  if (!allowed) return new NextResponse("Not allowed", { status: 403 });
  const absolute = resolveCv(profile.cv_path);
  if (!absolute) return new NextResponse("CV not found", { status: 404 });
  const bytes = readFileSync(absolute);
  const name = profile.cv_original_name || "cv";
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${name.replace(/"/g, "")}"`,
    },
  });
}
