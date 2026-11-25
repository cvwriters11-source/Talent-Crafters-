import Link from "next/link";
import { Dash } from "@/components/Dash";
import { requireUser } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/constants";
import { listCandidateApplications } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const user = await requireUser(["candidate"]);
  const rows = listCandidateApplications(user.id);
  return (
    <Dash role={user.role} name={user.display_name || user.email} userId={user.id} title="Applied jobs" path="/candidate/applications">
      <div className="table-wrap">
        <table>
          <thead><tr><th>Role</th><th>Company</th><th>Status</th><th>Submitted</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td><Link href={`/candidate/applications/${row.id}`}>{row.title}</Link></td>
                <td>{row.company_name}</td>
                <td><span className={`pill ${row.status}`}>{STATUS_LABELS[row.status] || row.status}</span></td>
                <td>{row.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <p className="muted" style={{ marginTop: "0.8rem" }}>You have not applied yet.</p>}
    </Dash>
  );
}
