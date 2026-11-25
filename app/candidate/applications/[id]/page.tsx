import Link from "next/link";
import { notFound } from "next/navigation";
import { Dash } from "@/components/Dash";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { messageAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/constants";
import { applicationEvents, getApplication, listInterviewsForApplication, listMessages } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function ApplicationDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const user = await requireUser(["candidate"]);
  const { id } = await params;
  const query = await searchParams;
  const application = getApplication(id);
  if (!application || application.candidate_user_id !== user.id) notFound();
  const events = applicationEvents(id);
  const messages = listMessages(id);
  const interviews = listInterviewsForApplication(id);
  return (
    <Dash role={user.role} name={user.display_name || user.email} userId={user.id} title="Application tracking" path="/candidate/applications">
      <Flash notice={query.notice} error={query.error} />
      <p className="kicker">{application.company_name}</p>
      <h2>{application.title}</h2>
      <p style={{ margin: "0.5rem 0 1rem" }}><span className={`pill ${application.status}`}>{STATUS_LABELS[application.status]}</span> · submitted {application.created_at}</p>
      <div className="split">
        <div>
          <h3>History</h3>
          <div className="timeline" style={{ marginTop: "0.6rem" }}>
            {events.map((event) => (
              <article key={event.id}>
                <strong>{STATUS_LABELS[event.status] || event.status}</strong>
                <p className="muted">{event.created_at}{event.note ? ` · ${event.note}` : ""}</p>
              </article>
            ))}
          </div>
          <h3 style={{ marginTop: "1.2rem" }}>Messages</h3>
          {messages.map((message) => (
            <article key={message.id} className="card" style={{ marginTop: "0.5rem" }}>
              <strong>{message.display_name}</strong>
              <p>{message.body}</p>
              <p className="muted">{message.created_at}</p>
            </article>
          ))}
          <form action={messageAction} style={{ marginTop: "0.8rem", display: "grid", gap: "0.6rem" }}>
            <input type="hidden" name="applicationId" value={id} />
            <label>Write to the hiring team<textarea name="body" required /></label>
            <SubmitButton>Send</SubmitButton>
          </form>
        </div>
        <aside>
          <article className="card">
            <h3>Interviews</h3>
            {interviews.map((item) => <p key={item.id}>{item.scheduled_at} · {item.mode} · {item.place}</p>)}
            {interviews.length === 0 && <p className="muted">No invitation yet.</p>}
            <p style={{ marginTop: "0.7rem" }}><Link href={`/jobs/${application.job_id}`}>View vacancy</Link></p>
          </article>
        </aside>
      </div>
    </Dash>
  );
}
