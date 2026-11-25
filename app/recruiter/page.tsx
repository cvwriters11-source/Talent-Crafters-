import Link from "next/link";
import { Dash } from "@/components/Dash";
import { Flash } from "@/components/Flash";
import { requireUser } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/constants";
import { getCompanyByOwner, listRecruiterApplications, recruiterJobs } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function RecruiterHome({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const user = await requireUser(["recruiter", "employer"]);
  const query = await searchParams;
  const company = getCompanyByOwner(user.id);
  const jobs = recruiterJobs(user.id);
  const applicants = listRecruiterApplications(user.id);
  return (
    <Dash role={user.role} name={company?.contact_name || user.email} userId={user.id} title={company?.name || "Hiring desk"} path="/recruiter">
      <Flash notice={query.notice} error={query.error} />
      {user.status !== "active" && <p className="alert">This company account is {user.status}. Vacancy posting opens after approval.</p>}
      <div className="stats">
        <article className="stat"><b>{jobs.length}</b>Vacancies</article>
        <article className="stat"><b>{jobs.filter((job) => job.status === "published").length}</b>Published</article>
        <article className="stat"><b>{jobs.filter((job) => job.status === "pending").length}</b>Awaiting approval</article>
        <article className="stat"><b>{applicants.length}</b>Applicants</article>
      </div>
      <h2 style={{ margin: "1.2rem 0 0.6rem" }}>Recruitment progress</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Vacancy</th><th>Status</th><th>Applicants</th></tr></thead>
          <tbody>
            {jobs.slice(0, 8).map((job) => (
              <tr key={job.id}>
                <td><Link href={`/recruiter/jobs/${job.id}`}>{job.title}</Link></td>
                <td><span className={`pill ${job.status}`}>{STATUS_LABELS[job.status]}</span></td>
                <td>{job.application_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Dash>
  );
}
