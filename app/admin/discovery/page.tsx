import Link from "next/link";
import { Dash } from "@/components/Dash";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { discoveryControlAction, moderateJobAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { COUNTRIES, STATUS_LABELS } from "@/lib/constants";
import { discoverySettings, discoveryStats, listCategories, listIndustries, listRuns, searchJobs } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function DiscoveryPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser(["admin", "super_admin"]);
  const query = await searchParams;
  const settings = discoverySettings();
  const stats = discoveryStats();
  const industries = listIndustries();
  const categories = listCategories();
  const runs = listRuns();
  const queue = searchJobs({
    q: query.q,
    status: query.status || "pending",
    origin: "discovery",
    country: query.country,
    page: Number(query.page || 1),
    pageSize: 15,
  }, false);
  const cards = [
    ["Companies discovered", stats.companies],
    ["Vacancies discovered", stats.vacancies],
    ["New vacancies today", stats.today],
    ["Companies with emails", stats.withEmail],
    ["Companies without contact", stats.withoutContact],
    ["Pending approvals", stats.pending],
    ["Approved vacancies", stats.approved],
    ["Rejected", stats.rejected],
    ["Expired", stats.expired],
  ];
  return (
    <Dash role={user.role} name={user.display_name || user.email} userId={user.id} title="AI Job Discovery Centre" path="/admin/discovery">
      <Flash notice={query.notice} />
      <div className="stats">
        {cards.map(([label, value]) => <article key={String(label)} className="stat"><b>{value}</b>{label}</article>)}
      </div>
      <form action={discoveryControlAction} className="card" style={{ marginTop: "1rem", display: "grid", gap: "0.8rem" }}>
        <h3>Discovery controls</h3>
        <p className="muted">Scheduled search is {settings.running ? "running" : "paused"}. Vacancies found in South Africa, Lesotho, Botswana, Eswatini and Zimbabwe are published after each search. Each registered candidate is then applied to published roles that match their career field and country. Sources are public job APIs. Company websites are opened only when robots.txt allows, and only a few per run.</p>
        <label>Keyword for this search<input name="query" defaultValue={settings.defaultQuery} placeholder="Optional, for example nursing or finance" /></label>
        <label>Repeat every (minutes, 15–1440)<input name="interval" type="number" min={15} max={1440} defaultValue={settings.intervalMinutes} /></label>
        <div>
          <p>Countries</p>
          <div className="check-grid">
            {COUNTRIES.map((country) => (
              <label key={country}><input type="checkbox" name="countries" value={country} defaultChecked={settings.countries.includes(country)} />{country}</label>
            ))}
          </div>
        </div>
        <div>
          <p>Industries</p>
          <div className="check-grid">
            {industries.map((industry) => (
              <label key={industry.id}><input type="checkbox" name="industries" value={industry.name} defaultChecked={settings.industries.includes(industry.name)} />{industry.name}</label>
            ))}
          </div>
        </div>
        <div>
          <p>Categories</p>
          <div className="check-grid">
            {categories.map((category) => (
              <label key={category.id}><input type="checkbox" name="categories" value={category.name} defaultChecked={settings.categories.includes(category.name)} />{category.name}</label>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <SubmitButton className="btn">Start discovery</SubmitButton>
          <button className="btn ghost" name="action" value="pause">Pause discovery</button>
          <button className="btn gold" name="action" value="run">Run manual search</button>
          <button className="btn ghost" name="action" value="save">Save schedule</button>
        </div>
        <input type="hidden" name="action" value="start" />
      </form>
      <p className="muted" style={{ marginTop: "0.5rem" }}>The primary button starts scheduled discovery and runs a search now. Pause stops future runs. Manual search works while paused.</p>
      <form className="filters" action="/admin/discovery" style={{ marginTop: "1rem" }}>
        <label>Search queue<input name="q" defaultValue={query.q || ""} /></label>
        <label>Status
          <select name="status" defaultValue={query.status || "pending"}>
            <option value="pending">Pending</option>
            <option value="published">Published</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
            <option value="">Any discovered</option>
          </select>
        </label>
        <label>Country<select name="country" defaultValue={query.country || ""}><option value="">Any</option>{COUNTRIES.map((country) => <option key={country}>{country}</option>)}</select></label>
        <button className="btn">Filter</button>
      </form>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Vacancy</th><th>Company</th><th>Location</th><th>Source</th><th></th></tr></thead>
          <tbody>
            {queue.rows.map((job) => (
              <tr key={job.id}>
                <td><Link href={`/admin/jobs/${job.id}`}>{job.title}</Link><div className="muted">{job.reference_code || ""}</div></td>
                <td>{job.company_name}</td>
                <td>{job.country || job.location}</td>
                <td>{job.source_name}</td>
                <td>
                  <form action={moderateJobAction} style={{ display: "flex", gap: "0.3rem" }}>
                    <input type="hidden" name="jobId" value={job.id} />
                    <button className="btn small" name="decision" value="publish">Approve & publish</button>
                    <button className="btn small ghost" name="decision" value="reject">Reject</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 style={{ margin: "1.2rem 0 0.6rem" }}>Recent runs</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>When</th><th>Trigger</th><th>Status</th><th>Found</th><th>New</th><th>Duplicates</th><th>Contacts checked</th><th>Notes</th></tr></thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id}>
                <td>{run.started_at}</td>
                <td>{run.trigger}</td>
                <td>{run.status}</td>
                <td>{run.found_count}</td>
                <td>{run.new_count}</td>
                <td>{run.duplicate_count}</td>
                <td>{run.enriched_count}</td>
                <td>{run.error}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: "0.8rem" }}><Link href="/admin/companies">View discovered companies</Link> · <a href="/api/admin/export?kind=companies">Export companies (CSV)</a> · <a href="/api/admin/export?kind=companies&format=xls">Excel</a></p>
    </Dash>
  );
}
