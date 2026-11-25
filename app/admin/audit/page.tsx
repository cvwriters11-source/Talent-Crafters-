import { Dash } from "@/components/Dash";
import { requireUser } from "@/lib/auth";
import { listAudit } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const user = await requireUser(["admin", "super_admin"]);
  const rows = listAudit();
  return (
    <Dash role={user.role} name={user.email} userId={user.id} title="Audit log" path="/admin/audit">
      <div className="table-wrap">
        <table>
          <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Record</th><th>Detail</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.created_at}</td>
                <td>{row.email || "system"}</td>
                <td>{row.action}</td>
                <td>{row.entity} {row.entity_id || ""}</td>
                <td>{row.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Dash>
  );
}
