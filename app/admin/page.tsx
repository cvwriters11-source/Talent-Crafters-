import Link from "next/link";
import { Dash } from "@/components/Dash";
import { Flash } from "@/components/Flash";
import { requireUser } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/constants";
import { platformStats, recentVacancies, vacancyActivity } from "@/lib/repo";

export const dynamic = "force-dynamic";

const tones = ["green", "teal", "violet", "indigo"] as const;

function MetricIcon({ tone }: { tone: (typeof tones)[number] }) {
  return (
    <span className={`kpi-icon ${tone}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {tone === "green" ? <path d="M12 3v18M7 8h8a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h9" /> : null}
        {tone === "teal" ? <path d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6" /> : null}
        {tone === "violet" ? <path d="M4 7h16M4 12h10M4 17h7" /> : null}
        {tone === "indigo" ? <path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 16l-4.9 2.2.9-5.5-4-3.9 5.5-.8z" /> : null}
      </svg>
    </span>
  );
}

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser(["admin", "super_admin"]);
  const query = await searchParams;
  const stats = platformStats();
  const activity = vacancyActivity();
  const recent = recentVacancies();
  const periods = [
    ["Today", activity.today, "green"],
    ["This week", activity.week, "teal"],
    ["This month", activity.month, "violet"],
    ["All time", activity.all, "indigo"],
  ] as const;
  const totals = [
    ["Total vacancies", activity.all, "teal", "", "M4 7h16M4 12h16M4 17h10"],
    ["Pending approvals", stats.pendingJobs, "orange", stats.pendingJobs > 0 ? "Requires attention" : "Queue is clear", "M12 7v6l4 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"],
    ["Published", stats.published, "green", "", "M5 12l5 5L20 7"],
    ["Job seekers", stats.candidates, "violet", stats.pendingUsers > 0 ? `${stats.pendingUsers} accounts waiting` : "", "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
  ] as const;
  return (
    <Dash role={user.role} name={user.display_name || user.email} userId={user.id} title="Dashboard" path="/admin">
      <Flash error={query.error} />
      <div className="dash-intro">
        <h2>Dashboard</h2>
        <p>Welcome back! Here&apos;s an overview of your operations.</p>
      </div>
      <div className="kpi-grid">
        {periods.map(([label, value, tone]) => (
          <article key={label} className="kpi">
            <div>
              <p>{label}</p>
              <strong>{value.toLocaleString("en-ZA")}</strong>
            </div>
            <MetricIcon tone={tone} />
          </article>
        ))}
      </div>
      <div className="kpi-grid">
        {totals.map(([label, value, tone, hint, path]) => (
          <article key={label} className="kpi">
            <div>
              <p>{label}</p>
              <strong>{value.toLocaleString("en-ZA")}</strong>
              {hint ? <em className={tone === "orange" ? "warn" : ""}>{hint}</em> : null}
            </div>
            <span className={`kpi-icon ${tone}`} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={path} />
              </svg>
            </span>
          </article>
        ))}
      </div>
      <section className="panel">
        <div className="panel-head">
          <h2>
            <span className="kpi-icon teal" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6" /></svg>
            </span>
            Latest vacancies
          </h2>
          <Link href="/admin/jobs">View all</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Vacancy</th>
                <th>Company</th>
                <th>Status</th>
                <th>Source</th>
                <th>Added</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((job) => (
                <tr key={job.id}>
                  <td><Link href={`/admin/jobs/${job.id}`}>{job.title}</Link></td>
                  <td>{job.company_name}</td>
                  <td><span className={`pill ${job.status}`}>{STATUS_LABELS[job.status] || job.status}</span></td>
                  <td>{job.source_name || "—"}</td>
                  <td>{job.created_at.slice(0, 16)}</td>
                </tr>
              ))}
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={5}>Vacancies appear here after a search or an employer submission.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </Dash>
  );
}
