import Link from "next/link";
import { Dash } from "@/components/Dash";
import { Flash } from "@/components/Flash";
import { requireUser } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/constants";
import { getCompanyByOwner, recruiterJobs } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function RecruiterJobs({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const user = await requireUser(["recruiter", "employer"]);
  const query = await searchParams;
  const company = getCompanyByOwner(user.id);
  const jobs = recruiterJobs(user.id);
  return (
    <Dash role={user.role} name={company?.contact_name || user.email} userId={user.id} title="Manage vacancies" path="/recruiter/jobs">
      <Flash notice={query.notice} />
      <p style={{ marginBottom: "0.8rem" }}><Link className="btn small" href="/recruiter/jobs/new">Post a new vacancy</Link></p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Title</th><th>Status</th><th>Closing</th><th>Applicants</th></tr></thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td><Link href={`/recruiter/jobs/${job.id}`}>{job.title}</Link></td>
                <td><span className={`pill ${job.status}`}>{STATUS_LABELS[job.status]}</span></td>
                <td>{job.deadline || "Not set"}</td>
                <td>{job.application_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Dash>
  );
}
