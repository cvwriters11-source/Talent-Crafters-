import { notFound } from "next/navigation";
import { Dash } from "@/components/Dash";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { messageAction, reviewApplicationAction, scheduleInterviewAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { APPLICATION_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { applicationEvents, getApplication, listMessages } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function AdminApplication({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const user = await requireUser(["admin", "super_admin"]);
  const application = getApplication((await params).id);
  const query = await searchParams;
  if (!application) notFound();
  return (
    <Dash role={user.role} name={user.email} userId={user.id} title="Application" path="/admin/applications">
      <Flash notice={query.notice} error={query.error} />
      <article className="card">
        <h2>{application.full_name}</h2>
        <p>{application.title} at {application.company_name}</p>
        <p>{application.email} · {application.phone}</p>
        {application.cv_path && <p><a href={`/api/files/cv?user=${application.candidate_user_id}&application=${application.id}`}>Download CV</a></p>}
      </article>
      <form action={reviewApplicationAction} className="card" style={{ marginTop: "0.8rem", display: "grid", gap: "0.5rem" }}>
        <input type="hidden" name="applicationId" value={application.id} />
        <select name="status" defaultValue={application.status}>{APPLICATION_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select>
        <textarea name="note" placeholder="History note" />
        <SubmitButton>Update status</SubmitButton>
      </form>
      <form action={scheduleInterviewAction} className="card" style={{ marginTop: "0.8rem", display: "grid", gap: "0.5rem" }}>
        <h3>Interview</h3>
        <input type="hidden" name="applicationId" value={application.id} />
        <input type="datetime-local" name="when" required />
        <select name="mode"><option value="online">Online</option><option value="in_person">In person</option><option value="phone">Phone</option></select>
        <input name="place" placeholder="Link or address" required />
        <textarea name="message" />
        <SubmitButton>Send invitation</SubmitButton>
      </form>
      <div className="timeline" style={{ marginTop: "0.8rem" }}>
        {applicationEvents(application.id).map((event) => <article key={event.id}><strong>{STATUS_LABELS[event.status]}</strong><p className="muted">{event.created_at} {event.note}</p></article>)}
      </div>
      <form action={messageAction} className="card" style={{ marginTop: "0.8rem" }}>
        <input type="hidden" name="applicationId" value={application.id} />
        {listMessages(application.id).map((message) => <p key={message.id}><strong>{message.display_name}: </strong>{message.body}</p>)}
        <textarea name="body" required />
        <SubmitButton>Send message</SubmitButton>
      </form>
    </Dash>
  );
}
