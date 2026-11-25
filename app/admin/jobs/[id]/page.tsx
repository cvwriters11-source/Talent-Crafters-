import { notFound } from "next/navigation";
import { Dash } from "@/components/Dash";
import { Flash } from "@/components/Flash";
import { JobFields } from "@/components/JobFields";
import { SubmitButton } from "@/components/SubmitButton";
import { editJobAction, moderateJobAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { getCompany, getJob, listCategories, listIndustries } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function AdminJob({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const user = await requireUser(["admin", "super_admin"]);
  const job = getJob((await params).id);
  const query = await searchParams;
  if (!job) notFound();
  const company = getCompany(job.company_id);
  return (
    <Dash role={user.role} name={user.email} userId={user.id} title="Review vacancy" path="/admin/jobs">
      <Flash notice={query.notice} error={query.error} />
      <p className="muted" style={{ marginBottom: "0.7rem" }}>Status {job.status}. {job.source_url && <a href={job.source_url} rel="noreferrer">Open the original advertisement</a>}</p>
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.8rem" }}>
        <form action={moderateJobAction}><input type="hidden" name="jobId" value={job.id} /><button className="btn small" name="decision" value="publish">Publish</button></form>
        <form action={moderateJobAction}><input type="hidden" name="jobId" value={job.id} /><button className="btn small ghost" name="decision" value="approve">Approve only</button></form>
        <form action={moderateJobAction}><input type="hidden" name="jobId" value={job.id} /><button className="btn small ghost" name="decision" value="unpublish">Unpublish</button></form>
        <form action={moderateJobAction}><input type="hidden" name="jobId" value={job.id} /><button className="btn small ghost" name="decision" value="archive">Archive</button></form>
        <form action={moderateJobAction}><input type="hidden" name="jobId" value={job.id} /><button className="btn small ghost" name="decision" value="expire">Mark expired</button></form>
        <form action={moderateJobAction}><input type="hidden" name="jobId" value={job.id} /><button className="btn small danger" name="decision" value="delete">Delete duplicate</button></form>
      </div>
      <form action={moderateJobAction} className="card" style={{ marginBottom: "0.8rem", display: "flex", gap: "0.5rem" }}>
        <input type="hidden" name="jobId" value={job.id} />
        <input name="reason" placeholder="Reason if you reject this vacancy" />
        <button className="btn danger" name="decision" value="reject">Reject</button>
      </form>
      <form action={editJobAction} className="card" style={{ display: "grid", gap: "0.8rem" }}>
        <input type="hidden" name="jobId" value={job.id} />
        {company?.source === "discovered" && (
          <div className="grid-2">
            <label>Company<input name="companyName" defaultValue={company.name} /></label>
            <label>Website<input name="website" defaultValue={company.website || ""} /></label>
            <label>Careers page<input name="careers" defaultValue={company.careers_page || ""} /></label>
            <label>Recruitment email<input name="recruitmentEmail" defaultValue={company.recruitment_email || ""} /></label>
            <label>HR email<input name="hrEmail" defaultValue={company.hr_email || ""} /></label>
            <label>General email<input name="generalEmail" defaultValue={company.general_email || ""} /></label>
            <label>Phone<input name="phone" defaultValue={company.phone || ""} /></label>
            <label>LinkedIn<input name="linkedin" defaultValue={company.linkedin_url || ""} /></label>
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
        )}
        <label>Original URL<input name="sourceUrl" defaultValue={job.source_url || ""} /></label>
        <JobFields job={job} industries={listIndustries()} categories={listCategories()} />
        <SubmitButton>Save edits</SubmitButton>
      </form>
    </Dash>
  );
}
