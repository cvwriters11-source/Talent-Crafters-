import Link from "next/link";
import { notFound } from "next/navigation";
import { Dash } from "@/components/Dash";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { editCompanyAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { COUNTRIES } from "@/lib/constants";
import { getCompany, listIndustries, searchJobs } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function CompanyAdmin({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string }> }) {
  const user = await requireUser(["admin", "super_admin"]);
  const company = getCompany((await params).id);
  const query = await searchParams;
  if (!company) notFound();
  const jobs = searchJobs({ pageSize: 20 }, false).rows.filter((job) => job.company_id === company.id);
  return (
    <Dash role={user.role} name={user.email} userId={user.id} title={company.name} path="/admin/companies">
      <Flash notice={query.notice} />
      <p className="muted">Discovered {company.discovered_at || company.created_at}. Last verification {company.last_verified_at || "not recorded"}. Published vacancies: {company.vacancy_count ?? jobs.filter((job) => job.status === "published").length}.</p>
      <form action={editCompanyAction} className="card" style={{ display: "grid", gap: "0.7rem", marginTop: "0.8rem" }}>
        <input type="hidden" name="companyId" value={company.id} />
        <div className="field-row">
          <label>Name<input name="name" defaultValue={company.name} /></label>
          <label>Industry<select name="industry" defaultValue={company.industry || ""}>{listIndustries().map((item) => <option key={item.id}>{item.name}</option>)}</select></label>
        </div>
        <div className="field-row">
          <label>Country<select name="country" defaultValue={company.country || ""}>{COUNTRIES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>City<input name="city" defaultValue={company.city || ""} /></label>
        </div>
        <label>Website<input name="website" defaultValue={company.website || ""} /></label>
        <label>Careers page<input name="careers" defaultValue={company.careers_page || ""} /></label>
        <div className="field-row">
          <label>HR email<input name="hrEmail" defaultValue={company.hr_email || ""} /></label>
          <label>Recruitment email<input name="recruitmentEmail" defaultValue={company.recruitment_email || ""} /></label>
        </div>
        <div className="field-row">
          <label>General email<input name="generalEmail" defaultValue={company.general_email || ""} /></label>
          <label>Telephone<input name="phone" defaultValue={company.phone || ""} /></label>
        </div>
        <label>LinkedIn<input name="linkedin" defaultValue={company.linkedin_url || ""} /></label>
        <div className="field-row">
          <label>Email status
            <select name="emailStatus" defaultValue={company.email_status}>
              <option value="verified">Verified company domain</option>
              <option value="unverified">Unverified</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </label>
          <label>Contact status
            <select name="contactStatus" defaultValue={company.contact_status}>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </label>
        </div>
        <label>Description<textarea name="description" defaultValue={company.description || ""} /></label>
        <SubmitButton>Save company</SubmitButton>
      </form>
      <h3 style={{ marginTop: "1rem" }}>Vacancies</h3>
      {jobs.map((job) => <p key={job.id}><Link href={`/admin/jobs/${job.id}`}>{job.title}</Link> · {job.status}</p>)}
    </Dash>
  );
}
