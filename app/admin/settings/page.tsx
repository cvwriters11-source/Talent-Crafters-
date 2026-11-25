import { Dash } from "@/components/Dash";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { passwordAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminSettings({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const user = await requireUser(["admin", "super_admin"]);
  const query = await searchParams;
  return (
    <Dash role={user.role} name={user.email} userId={user.id} title="Platform settings" path="/admin/settings">
      <Flash notice={query.notice} error={query.error} />
      <div className="grid-2">
        <form action={passwordAction} className="card" style={{ display: "grid", gap: "0.7rem" }}>
          <h3>Your password</h3>
          <label>Current password<input type="password" name="current" required /></label>
          <label>New password<input type="password" name="password" required /></label>
          <SubmitButton>Update password</SubmitButton>
        </form>
        <article className="card">
          <h3>Integrations</h3>
          <p>Email notifications use SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and SMTP_FROM.</p>
          <p style={{ marginTop: "0.5rem" }}>Optional Adzuna results use ADZUNA_APP_ID and ADZUNA_APP_KEY. Without them, discovery still reads Remotive, Arbeitnow, Jobicy and Himalayas.</p>
          <p style={{ marginTop: "0.5rem" }}>WhatsApp uses WHATSAPP_WEBHOOK_URL and only for candidates who opted in.</p>
          <p style={{ marginTop: "0.5rem" }}>A scheduler calls the discovery service every minute and runs a search when the centre is started and the interval has elapsed. An external cron can call /api/cron/discovery with the CRON_SECRET bearer token.</p>
          <p style={{ marginTop: "0.7rem" }}><a href="/api/admin/export?kind=report">Export a platform report (CSV)</a></p>
        </article>
      </div>
    </Dash>
  );
}
