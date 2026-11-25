import Link from "next/link";
import { Dash } from "@/components/Dash";
import { requireUser } from "@/lib/auth";
import { COUNTRIES, STATUS_LABELS } from "@/lib/constants";
import { listCompanies } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser(["admin", "super_admin"]);
  const query = await searchParams;
  const result = listCompanies({ q: query.q, country: query.country, contact: query.contact, source: query.source, limit: 40, offset: Number(query.page || 0) * 40 });
  return (
    <Dash role={user.role} name={user.display_name || user.email} userId={user.id} title="Company database" path="/admin/companies">
      <form className="filters" action="/admin/companies">
        <label>Search<input name="q" defaultValue={query.q || ""} placeholder="Name, email, city" /></label>
        <label>Country<select name="country" defaultValue={query.country || ""}><option value="">Any</option>{COUNTRIES.map((country) => <option key={country}>{country}</option>)}</select></label>
        <label>Contact
          <select name="contact" defaultValue={query.contact || ""}>
            <option value="">Any</option>
            <option value="with_email">With an email</option>
            <option value="without">Without contact details</option>
          </select>
        </label>
        <label>Source
          <select name="source" defaultValue={query.source || ""}>
            <option value="">Any</option>
            <option value="discovered">Discovered</option>
            <option value="registered">Registered</option>
          </select>
        </label>
        <button className="btn">Filter</button>
      </form>
      <p style={{ margin: "0.6rem 0" }}>{result.total} companies · <a href="/api/admin/export?kind=companies">CSV</a> · <a href="/api/admin/export?kind=companies&format=xls">Excel</a></p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Company</th><th>Industry</th><th>Place</th><th>Recruitment email</th><th>Phone</th><th>Status</th><th>Verified</th></tr></thead>
          <tbody>
            {result.rows.map((company) => (
              <tr key={company.id}>
                <td><Link href={`/admin/companies/${company.id}`}>{company.name}</Link></td>
                <td>{company.industry}</td>
                <td>{[company.city, company.country].filter(Boolean).join(", ")}</td>
                <td>{company.recruitment_email || company.hr_email || company.general_email || "Unavailable"}</td>
                <td>{company.phone || "—"}</td>
                <td><span className={`pill ${company.email_status}`}>{STATUS_LABELS[company.email_status]}</span></td>
                <td>{company.last_verified_at || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Dash>
  );
}
