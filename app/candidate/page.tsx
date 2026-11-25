import Link from "next/link";
import { Dash } from "@/components/Dash";
import { Flash } from "@/components/Flash";
import { requireUser } from "@/lib/auth";
import { listCandidateApplications, recommendations, unreadCount } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function CandidateHome({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const user = await requireUser(["candidate"]);
  const query = await searchParams;
  const applications = listCandidateApplications(user.id);
  const jobs = user.status === "active" ? recommendations(user.id) : [];
  return (
    <Dash role={user.role} name={user.display_name || user.email} userId={user.id} title="Your desk" path="/candidate">
      <Flash notice={query.notice} />
      {user.status !== "active" && <p className="alert">This account is {user.status}. Job applications open after an administrator approves it.</p>}
      <div className="stats">
        <article className="stat"><b>{applications.length}</b>Applications</article>
        <article className="stat"><b>{applications.filter((item) => item.status === "shortlisted" || item.status === "interview").length}</b>In progress</article>
        <article className="stat"><b>{jobs.length}</b>Recommendations</article>
        <article className="stat"><b>{unreadCount(user.id)}</b>Unread notices</article>
      </div>
      <h2 style={{ margin: "1.4rem 0 0.7rem" }}>Job recommendations</h2>
      <div className="grid-3">
        {jobs.map((job) => (
          <Link key={job.id} className="card job-card" href={`/jobs/${job.id}`}>
            <p className="kicker">{job.company_name}</p>
            <h3>{job.title}</h3>
            <p className="muted">{job.country || job.location}</p>
          </Link>
        ))}
        {jobs.length === 0 && <p className="muted">Recommendations appear when published vacancies match your career field.</p>}
      </div>
    </Dash>
  );
}
