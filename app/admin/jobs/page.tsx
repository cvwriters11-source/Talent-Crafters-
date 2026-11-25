import Link from "next/link";
import { Dash } from "@/components/Dash";
import { Flash } from "@/components/Flash";
import { requireUser } from "@/lib/auth";
import { JOB_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { searchJobs } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function AdminJobs({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser(["admin", "super_admin"]);
  const query = await searchParams;
  const result = searchJobs({ q: query.q, status: query.status, origin: query.origin, page: Number(query.page || 1), pageSize: 20 }, false);
  return (
    <Dash role={user.role} name={user.email} userId={user.id} title="Vacancies" path="/admin/jobs">
      <Flash notice={query.notice} />
      <form className="filters" action="/admin/jobs">
        <label>Search<input name="q" defaultValue={query.q || ""} /></label>
        <label>Status<select name="status" defaultValue={query.status || ""}><option value="">Any</option>{JOB_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select></label>
        <label>Origin<select name="origin" defaultValue={query.origin || ""}><option value="">Any</option><option value="discovery">Discovery</option><option value="recruiter">Recruiter</option></select></label>
        <button className="btn">Filter</button>
      </form>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Title</th><th>Company</th><th>Status</th><th>Origin</th><th>Closing</th></tr></thead>
          <tbody>
            {result.rows.map((job) => (
              <tr key={job.id}>
                <td><Link href={`/admin/jobs/${job.id}`}>{job.title}</Link></td>
                <td>{job.company_name}</td>
                <td><span className={`pill ${job.status}`}>{STATUS_LABELS[job.status]}</span></td>
                <td>{job.origin}</td>
                <td>{job.deadline || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Dash>
  );
}
