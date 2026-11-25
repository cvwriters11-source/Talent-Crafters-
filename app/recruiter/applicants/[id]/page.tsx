import { notFound } from "next/navigation";
import { Dash } from "@/components/Dash";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { messageAction, reviewApplicationAction, scheduleInterviewAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { APPLICATION_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { applicationEvents, getApplication, getCandidate, listMessages } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function ApplicantReview({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const user = await requireUser(["recruiter", "employer"]);
  const application = getApplication((await params).id);
  const query = await searchParams;
  if (!application || application.owner_user_id !== user.id) notFound();
  const profile = getCandidate(application.candidate_user_id);
  const events = applicationEvents(application.id);
  const messages = listMessages(application.id);
  return (
    <Dash role={user.role} name={user.display_name || user.email} userId={user.id} title="Review applicant" path="/recruiter/applicants">
      <Flash notice={query.notice} error={query.error} />
      <div className="split">
        <div style={{ display: "grid", gap: "0.8rem" }}>
          <article className="card">
            <h2>{application.full_name}</h2>
            <p>{application.title} · {application.email} · {application.phone}</p>
            <p>{profile?.qualification} · {profile?.years_experience} years · {profile?.location}</p>
            {application.note && <p style={{ marginTop: "0.6rem" }}>{application.note}</p>}
            {application.cv_path && <p style={{ marginTop: "0.6rem" }}><a className="btn small" href={`/api/files/cv?user=${application.candidate_user_id}&application=${application.id}`}>Download CV</a></p>}
          </article>
          <form action={reviewApplicationAction} className="card" style={{ display: "grid", gap: "0.6rem" }}>
            <h3>Status</h3>
            <input type="hidden" name="applicationId" value={application.id} />
            <select name="status" defaultValue={application.status}>
              {APPLICATION_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
            </select>
            <textarea name="note" placeholder="Note for the history" />
            <SubmitButton>Update status</SubmitButton>
          </form>
          <div className="timeline">
            {events.map((event) => <article key={event.id}><strong>{STATUS_LABELS[event.status]}</strong><p className="muted">{event.created_at} {event.note}</p></article>)}
          </div>
        </div>
        <div style={{ display: "grid", gap: "0.8rem" }}>
          <form action={scheduleInterviewAction} className="card" style={{ display: "grid", gap: "0.6rem" }}>
            <h3>Schedule interview</h3>
            <input type="hidden" name="applicationId" value={application.id} />
            <label>When<input type="datetime-local" name="when" required /></label>
            <label>Mode<select name="mode" defaultValue="online"><option value="online">Online</option><option value="in_person">In person</option><option value="phone">Phone</option></select></label>
            <label>Link or address<input name="place" required /></label>
            <label>Message<textarea name="message" /></label>
            <SubmitButton>Send invitation</SubmitButton>
          </form>
          <article className="card">
            <h3>Messages</h3>
            {messages.map((message) => <p key={message.id}><strong>{message.display_name}: </strong>{message.body}</p>)}
            <form action={messageAction} style={{ display: "grid", gap: "0.5rem", marginTop: "0.6rem" }}>
              <input type="hidden" name="applicationId" value={application.id} />
              <textarea name="body" required />
              <SubmitButton>Send message</SubmitButton>
            </form>
          </article>
        </div>
      </div>
    </Dash>
  );
}
