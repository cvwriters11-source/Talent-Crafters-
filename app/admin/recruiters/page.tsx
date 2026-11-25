import { Dash } from "@/components/Dash";
import { Flash } from "@/components/Flash";
import { setAccountStatusAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/constants";
import { listUsers } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function RecruitersAdmin({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const user = await requireUser(["admin", "super_admin"]);
  const query = await searchParams;
  const people = listUsers("recruiter");
  return (
    <Dash role={user.role} name={user.email} userId={user.id} title="Recruiters and employers" path="/admin/recruiters">
      <Flash notice={query.notice} error={query.error} />
      <div className="table-wrap">
        <table>
          <thead><tr><th>Company</th><th>Contact</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {people.map((person) => (
              <tr key={person.id}>
                <td>{person.company_name}</td>
                <td>{person.contact_name || person.full_name}</td>
                <td>{person.email}</td>
                <td>{person.role}</td>
                <td><span className={`pill ${person.status}`}>{STATUS_LABELS[person.status]}</span></td>
                <td>
                  <form action={setAccountStatusAction} style={{ display: "flex", gap: "0.3rem" }}>
                    <input type="hidden" name="userId" value={person.id} />
                    <button className="btn small" name="status" value="active">Approve</button>
                    <button className="btn small ghost" name="status" value="rejected">Reject</button>
                    <button className="btn small ghost" name="status" value="suspended">Suspend</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Dash>
  );
}
