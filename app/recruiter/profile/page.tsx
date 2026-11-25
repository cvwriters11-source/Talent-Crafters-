import { Dash } from "@/components/Dash";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { updateCompanyProfileAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { COUNTRIES } from "@/lib/constants";
import { getCompanyByOwner, listIndustries } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function RecruiterProfile({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const user = await requireUser(["recruiter", "employer"]);
  const company = getCompanyByOwner(user.id);
  const query = await searchParams;
  if (!company) return null;
  return (
    <Dash role={user.role} name={company.contact_name || user.email} userId={user.id} title="Company profile" path="/recruiter/profile">
      <Flash notice={query.notice} />
      <form action={updateCompanyProfileAction} className="card" style={{ display: "grid", gap: "0.75rem" }}>
        <div className="field-row">
          <label>Company name<input name="company" defaultValue={company.name} required /></label>
          <label>Contact name<input name="contact" defaultValue={company.contact_name || ""} /></label>
        </div>
        <div className="field-row">
          <label>Industry<select name="industry" defaultValue={company.industry || ""}>{listIndustries().map((item) => <option key={item.id}>{item.name}</option>)}</select></label>
          <label>Phone<input name="phone" defaultValue={company.phone || ""} /></label>
        </div>
        <div className="field-row">
          <label>Country<select name="country" defaultValue={company.country || ""}>{COUNTRIES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>City<input name="city" defaultValue={company.city || ""} /></label>
        </div>
        <label>Website<input name="website" defaultValue={company.website || ""} /></label>
        <label>Careers page<input name="careers" defaultValue={company.careers_page || ""} /></label>
        <label>LinkedIn<input name="linkedin" defaultValue={company.linkedin_url || ""} /></label>
        <div className="field-row">
          <label>HR email<input name="hrEmail" defaultValue={company.hr_email || ""} /></label>
          <label>Recruitment email<input name="recruitmentEmail" defaultValue={company.recruitment_email || ""} /></label>
        </div>
        <label>Description<textarea name="description" defaultValue={company.description || ""} /></label>
        <SubmitButton>Save company</SubmitButton>
      </form>
    </Dash>
  );
}
