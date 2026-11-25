import { Dash } from "@/components/Dash";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { uploadCvAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { getCandidate } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function CvPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const user = await requireUser(["candidate"]);
  const query = await searchParams;
  const profile = getCandidate(user.id);
  return (
    <Dash role={user.role} name={user.display_name || user.email} userId={user.id} title="CV" path="/candidate/cv">
      <Flash notice={query.notice} error={query.error} />
      <article className="card" style={{ display: "grid", gap: "0.8rem" }}>
        <p>Current file: {profile?.cv_original_name || "None"} {profile?.cv_updated_at ? `· updated ${profile.cv_updated_at}` : ""}</p>
        {profile?.cv_path && <p><a href={`/api/files/cv?user=${user.id}`}>Download CV</a></p>}
        <form action={uploadCvAction} style={{ display: "grid", gap: "0.7rem" }}>
          <label>Replace CV<input name="cv" type="file" accept=".pdf,.doc,.docx,application/pdf" required /></label>
          <SubmitButton>Upload CV</SubmitButton>
        </form>
      </article>
    </Dash>
  );
}
