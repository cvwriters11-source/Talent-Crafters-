import Link from "next/link";
import { Dash } from "@/components/Dash";
import { Flash } from "@/components/Flash";
import { requireUser } from "@/lib/auth";
import { applicationsByStatus, jobsByIndustry, platformStats, recentCompanies } from "@/lib/repo";
import { STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser(["admin", "super_admin"]);
  const query = await searchParams;
  const stats = platformStats();
  const industries = jobsByIndustry();
  const statuses = applicationsByStatus();
  const maxIndustry = Math.max(1, ...industries.map((item) => item.count));
  const recent = recentCompanies();
  const cards = [
    ["Candidates", stats.candidates],
    ["Recruiters", stats.recruiters],
    ["Companies", stats.companies],
    ["Discovered jobs", stats.discovered],
    ["Published jobs", stats.published],
    ["Applications", stats.applications],
    ["Pending approvals", stats.pendingJobs],
    ["Active vacancies", stats.activeVacancies],
  ];
  return (
    <Dash role={user.role} name={user.display_name || user.email} userId={user.id} title="Platform overview" path="/admin">
      <Flash error={query.error} />
      <div className="stats">
        {cards.map(([label, value]) => <article key={label} className="stat"><b>{value}</b>{label}</article>)}
      </div>
      <p className="muted" style={{ marginTop: "0.6rem" }}>{stats.pendingUsers} accounts are waiting for approval.</p>
      <div className="grid-2" style={{ marginTop: "1.2rem" }}>
        <article className="card">
          <h3>Published jobs by industry</h3>
          {industries.map((item) => (
            <div key={item.industry} style={{ marginTop: "0.55rem" }}>
              <span>{item.industry} · {item.count}</span>
              <div className="bar"><span style={{ width: `${(item.count / maxIndustry) * 100}%` }} /></div>
            </div>
          ))}
          {industries.length === 0 && <p className="muted">Analytics appear after vacancies are published.</p>}
        </article>
        <article className="card">
          <h3>Applications</h3>
          {statuses.map((item) => <p key={item.status}>{STATUS_LABELS[item.status] || item.status}: {item.count}</p>)}
          <p style={{ marginTop: "0.8rem" }}><Link href="/admin/discovery">Open the discovery centre</Link></p>
        </article>
      </div>
      <h2 style={{ margin: "1.2rem 0 0.6rem" }}>Recently discovered companies</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Company</th><th>Country</th><th>Email status</th><th>Discovered</th></tr></thead>
          <tbody>
            {recent.map((company) => (
              <tr key={company.id}>
                <td><Link href={`/admin/companies/${company.id}`}>{company.name}</Link></td>
                <td>{company.country || "—"}</td>
                <td><span className={`pill ${company.email_status}`}>{STATUS_LABELS[company.email_status]}</span></td>
                <td>{company.discovered_at || company.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Dash>
  );
}
