import Link from "next/link";
import { Dash } from "@/components/Dash";
import { requireUser } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/constants";
import { listRecruiterApplications } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function ApplicantsPage() {
  const user = await requireUser(["recruiter", "employer"]);
  const rows = listRecruiterApplications(user.id);
  return (
    <Dash role={user.role} name={user.display_name || user.email} userId={user.id} title="Applicants" path="/recruiter/applicants">
      <div className="table-wrap">
        <table>
          <thead><tr><th>Candidate</th><th>Vacancy</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td><Link href={`/recruiter/applicants/${row.id}`}>{row.full_name}</Link></td>
                <td>{row.title}</td>
                <td><span className={`pill ${row.status}`}>{STATUS_LABELS[row.status]}</span></td>
                <td>{row.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Dash>
  );
}
