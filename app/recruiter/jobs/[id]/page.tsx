import Link from "next/link";
import { notFound } from "next/navigation";
import { Dash } from "@/components/Dash";
import { Flash } from "@/components/Flash";
import { JobFields } from "@/components/JobFields";
import { SubmitButton } from "@/components/SubmitButton";
import { updateRecruiterJobAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/constants";
import { getJob, listCategories, listIndustries, listJobApplications } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function RecruiterJob({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const user = await requireUser(["recruiter", "employer"]);
  const { id } = await params;
  const query = await searchParams;
  const job = getJob(id);
  if (!job || job.owner_user_id !== user.id) notFound();
  const applicants = listJobApplications(id);
  return (
    <Dash role={user.role} name={user.display_name || user.email} userId={user.id} title="Edit vacancy" path="/recruiter/jobs">
      <Flash notice={query.notice} error={query.error} />
      <p style={{ marginBottom: "0.8rem" }}><span className={`pill ${job.status}`}>{STATUS_LABELS[job.status]}</span> Editing a live vacancy sends it back for approval.</p>
      <form action={updateRecruiterJobAction} className="card">
        <input type="hidden" name="jobId" value={job.id} />
        <JobFields job={job} industries={listIndustries()} categories={listCategories()} />
        <div style={{ marginTop: "0.8rem" }}><SubmitButton>Save and resubmit</SubmitButton></div>
      </form>
      <h2 style={{ margin: "1.2rem 0 0.6rem" }}>Applicants</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Status</th><th>Experience</th><th></th></tr></thead>
          <tbody>
            {applicants.map((applicant) => (
              <tr key={applicant.id}>
                <td>{applicant.full_name}</td>
                <td><span className={`pill ${applicant.status}`}>{STATUS_LABELS[applicant.status]}</span></td>
                <td>{applicant.years_experience} years · {applicant.qualification}</td>
                <td><Link href={`/recruiter/applicants/${applicant.id}`}>Review</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Dash>
  );
}
