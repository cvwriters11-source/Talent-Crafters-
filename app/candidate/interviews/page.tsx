import { Dash } from "@/components/Dash";
import { requireUser } from "@/lib/auth";
import { listInterviewsForCandidate } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function InterviewsPage() {
  const user = await requireUser(["candidate"]);
  const rows = listInterviewsForCandidate(user.id);
  return (
    <Dash role={user.role} name={user.display_name || user.email} userId={user.id} title="Interview invitations" path="/candidate/interviews">
      <div className="grid-2">
        {rows.map((row) => (
          <article key={row.id} className="card">
            <p className="kicker">{row.company_name}</p>
            <h3>{row.title}</h3>
            <p>{row.scheduled_at}</p>
            <p>{row.mode} · {row.place}</p>
            {row.message && <p className="muted">{row.message}</p>}
          </article>
        ))}
      </div>
      {rows.length === 0 && <p className="muted">Invitations will appear here when a recruiter schedules them.</p>}
    </Dash>
  );
}
