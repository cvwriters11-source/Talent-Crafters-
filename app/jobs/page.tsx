import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/Flash";
import { PublicShell } from "@/components/SiteChrome";
import { COUNTRIES, EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, SALARY_BANDS, STATUS_LABELS } from "@/lib/constants";
import { listCategories, listIndustries, searchJobs } from "@/lib/repo";

export const metadata: Metadata = { title: "Jobs" };
export const dynamic = "force-dynamic";

export default async function JobsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const page = Number(query.page || 1);
  const result = searchJobs({
    q: query.q,
    company: query.company,
    country: query.country,
    city: query.city,
    industry: query.industry,
    salary: query.salary,
    employment: query.employment,
    level: query.level,
    category: query.category,
    page,
  }, true);
  const industries = listIndustries();
  const preserve = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value && key !== "page") preserve.set(key, value);
  }
  return (
    <PublicShell>
      <section className="page-hero">
        <p className="eyebrow">Vacancies</p>
        <h1>Approved jobs, ready to read.</h1>
      </section>
      <section className="wrap">
        <Flash error={query.error} />
        <form className="card" action="/jobs" style={{ marginBottom: "1rem" }}>
          <div className="filters">
            <label>Title<input name="q" defaultValue={query.q || ""} placeholder="Search by title" /></label>
            <label>Company<input name="company" defaultValue={query.company || ""} /></label>
            <label>Country
              <select name="country" defaultValue={query.country || ""}>
                <option value="">Any country</option>
                {COUNTRIES.map((country) => <option key={country}>{country}</option>)}
              </select>
            </label>
            <label>City<input name="city" defaultValue={query.city || ""} /></label>
            <label>Industry
              <select name="industry" defaultValue={query.industry || ""}>
                <option value="">Any industry</option>
                {industries.map((industry) => <option key={industry.id}>{industry.name}</option>)}
              </select>
            </label>
            <label>Category
              <select name="category" defaultValue={query.category || ""}>
                <option value="">Any category</option>
                {listCategories().map((category) => <option key={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label>Salary
              <select name="salary" defaultValue={query.salary || ""}>
                {SALARY_BANDS.map((band) => <option key={band.id} value={band.id}>{band.label}</option>)}
              </select>
            </label>
            <label>Employment type
              <select name="employment" defaultValue={query.employment || ""}>
                <option value="">Any type</option>
                {EMPLOYMENT_TYPES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>Experience level
              <select name="level" defaultValue={query.level || ""}>
                <option value="">Any level</option>
                {EXPERIENCE_LEVELS.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>
          <button className="btn">Apply filters</button>
        </form>
        <p className="muted" style={{ marginBottom: "0.8rem" }}>{result.total} published {result.total === 1 ? "vacancy" : "vacancies"}</p>
        <div className="grid-3">
          {result.rows.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="card job-card">
              <p className="kicker">{job.company_name}</p>
              <h3>{job.title}</h3>
              <div className="meta">
                <span className="pill">{job.country || "Location in listing"}</span>
                <span className="pill">{job.industry}</span>
                <span className="pill">{job.employment_type}</span>
              </div>
              <p className="muted">{job.salary_text || "Salary not advertised"}</p>
              <p className="muted">Closes {job.deadline || "on a date not advertised"} · {STATUS_LABELS[job.experience_level || ""] || job.experience_level}</p>
            </Link>
          ))}
        </div>
        {result.rows.length === 0 && <div className="card"><h3>No published vacancies match these filters.</h3></div>}
        <div style={{ display: "flex", gap: "0.6rem", marginTop: "1rem" }}>
          {result.page > 1 && <Link className="btn ghost" href={`/jobs?${new URLSearchParams({ ...Object.fromEntries(preserve), page: String(result.page - 1) })}`}>Previous</Link>}
          {result.page < result.pages && <Link className="btn ghost" href={`/jobs?${new URLSearchParams({ ...Object.fromEntries(preserve), page: String(result.page + 1) })}`}>Next</Link>}
        </div>
      </section>
    </PublicShell>
  );
}
