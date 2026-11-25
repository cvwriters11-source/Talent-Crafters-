import { Dash } from "@/components/Dash";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { deleteOwnAccountAction, passwordAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CandidateSettings({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const user = await requireUser(["candidate"]);
  const query = await searchParams;
  return (
    <Dash role={user.role} name={user.display_name || user.email} userId={user.id} title="Account settings" path="/candidate/settings">
      <Flash notice={query.notice} error={query.error} />
      <div className="grid-2">
        <form action={passwordAction} className="card" style={{ display: "grid", gap: "0.7rem" }}>
          <h3>Password</h3>
          <label>Current password<input name="current" type="password" required /></label>
          <label>New password<input name="password" type="password" required minLength={8} /></label>
          <SubmitButton>Update password</SubmitButton>
        </form>
        <article className="card">
          <h3>Your data</h3>
          <p className="muted">Download the profile, applications, and saved jobs stored for this account.</p>
          <p style={{ margin: "0.7rem 0" }}><a className="btn small" href="/api/account/export">Export my data</a></p>
          <form action={deleteOwnAccountAction} style={{ display: "grid", gap: "0.6rem" }}>
            <label>Type DELETE to remove this account and CV<input name="confirm" /></label>
            <SubmitButton className="btn danger">Delete account</SubmitButton>
          </form>
        </article>
      </div>
    </Dash>
  );
}
