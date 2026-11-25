import { Dash } from "@/components/Dash";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { markReadAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { listNotifications } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const user = await requireUser(["candidate"]);
  const query = await searchParams;
  const notes = listNotifications(user.id);
  return (
    <Dash role={user.role} name={user.display_name || user.email} userId={user.id} title="Notifications" path="/candidate/notifications">
      <Flash notice={query.notice} />
      <form action={markReadAction}><SubmitButton className="btn small ghost">Mark all read</SubmitButton></form>
      <div style={{ display: "grid", gap: "0.6rem", marginTop: "0.8rem" }}>
        {notes.map((note) => (
          <article key={note.id} className="card">
            <strong>{note.title}</strong>
            <p>{note.body}</p>
            <p className="muted">{note.created_at} · email {note.email_status || "not sent"}{note.read_at ? "" : " · unread"}</p>
          </article>
        ))}
        {notes.length === 0 && <p className="muted">No notifications yet.</p>}
      </div>
    </Dash>
  );
}
