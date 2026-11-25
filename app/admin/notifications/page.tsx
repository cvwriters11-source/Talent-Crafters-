import { Dash } from "@/components/Dash";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { markReadAction, sendNoticeAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { listNotifications } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function AdminNotifications({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const user = await requireUser(["admin", "super_admin"]);
  const query = await searchParams;
  const notes = listNotifications(user.id);
  return (
    <Dash role={user.role} name={user.email} userId={user.id} title="Notifications" path="/admin/notifications">
      <Flash notice={query.notice} error={query.error} />
      <form action={sendNoticeAction} className="card" style={{ display: "grid", gap: "0.7rem" }}>
        <h3>Send a notification</h3>
        <label>Audience
          <select name="audience" defaultValue="candidates">
            <option value="candidates">All active candidates</option>
            <option value="recruiters">All active recruiters and employers</option>
            <option value="all">Candidates and hiring accounts</option>
            <option value="one">One email address</option>
          </select>
        </label>
        <label>Email, if sending to one person<input name="email" type="email" /></label>
        <label>Title<input name="title" required /></label>
        <label>Message<textarea name="body" required /></label>
        <SubmitButton>Send</SubmitButton>
        <p className="muted">In-platform notices are always stored. Email is sent when SMTP is configured. WhatsApp is sent only for application events when a webhook is configured and the candidate opted in.</p>
      </form>
      <form action={markReadAction} style={{ marginTop: "1rem" }}><button className="btn small ghost">Mark my notices read</button></form>
      <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.7rem" }}>
        {notes.map((note) => <article key={note.id} className="card"><strong>{note.title}</strong><p>{note.body}</p><p className="muted">{note.created_at}</p></article>)}
      </div>
    </Dash>
  );
}
