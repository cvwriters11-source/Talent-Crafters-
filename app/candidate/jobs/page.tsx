import Link from "next/link";
import { Dash } from "@/components/Dash";
import { requireUser } from "@/lib/auth";
import { getCandidate, searchJobs } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function CandidateJobs() {
  const user = await requireUser(["candidate"]);
  const profile = getCandidate(user.id);
  const jobs = searchJobs({ industry: profile?.career_field, pageSize: 24 }, true).rows;
  return (
    <Dash role={user.role} name={user.display_name || user.email} userId={user.id} title="Available jobs" path="/candidate/jobs">
      <p className="muted" style={{ marginBottom: "0.8rem" }}>Published vacancies in {profile?.career_field}. <Link href="/jobs">Search the full catalogue</Link>.</p>
      <div className="grid-3">
        {jobs.map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`} className="card job-card">
            <p className="kicker">{job.company_name}</p>
            <h3>{job.title}</h3>
            <p className="muted">{job.country || job.location} · Closes {job.deadline || "date not advertised"}</p>
          </Link>
        ))}
      </div>
    </Dash>
  );
}
