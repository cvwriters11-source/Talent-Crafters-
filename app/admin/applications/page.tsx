import Link from "next/link";
import { Dash } from "@/components/Dash";
import { requireUser } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/constants";
import { listAllApplications } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function AdminApplications() {
  const user = await requireUser(["admin", "super_admin"]);
  const rows = listAllApplications();
  return (
    <Dash role={user.role} name={user.email} userId={user.id} title="Applications" path="/admin/applications">
      <div className="table-wrap">
        <table>
          <thead><tr><th>Candidate</th><th>Vacancy</th><th>Company</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td><Link href={`/admin/applications/${row.id}`}>{row.full_name}</Link></td>
                <td>{row.title}</td>
                <td>{row.company_name}</td>
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
