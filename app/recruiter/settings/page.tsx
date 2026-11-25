import { Dash } from "@/components/Dash";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { deleteOwnAccountAction, passwordAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RecruiterSettings({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const user = await requireUser(["recruiter", "employer"]);
  const query = await searchParams;
  return (
    <Dash role={user.role} name={user.display_name || user.email} userId={user.id} title="Settings" path="/recruiter/settings">
      <Flash notice={query.notice} error={query.error} />
      <div className="grid-2">
        <form action={passwordAction} className="card" style={{ display: "grid", gap: "0.7rem" }}>
          <h3>Password</h3>
          <label>Current password<input type="password" name="current" required /></label>
          <label>New password<input type="password" name="password" required /></label>
          <SubmitButton>Update password</SubmitButton>
        </form>
        <form action={deleteOwnAccountAction} className="card" style={{ display: "grid", gap: "0.7rem" }}>
          <h3>Close account</h3>
          <p className="muted">Published vacancies remain in the company record until an administrator archives them.</p>
          <label>Type DELETE<input name="confirm" /></label>
          <SubmitButton className="btn danger">Delete account</SubmitButton>
        </form>
      </div>
    </Dash>
  );
}
