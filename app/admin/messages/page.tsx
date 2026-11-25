import { Dash } from "@/components/Dash";
import { requireUser } from "@/lib/auth";
import { listContacts } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const user = await requireUser(["admin", "super_admin"]);
  const rows = listContacts();
  return (
    <Dash role={user.role} name={user.email} userId={user.id} title="Contact messages" path="/admin/messages">
      <div style={{ display: "grid", gap: "0.6rem" }}>
        {rows.map((row) => (
          <article key={row.id} className="card">
            <h3>{row.subject}</h3>
            <p>{row.name} · {row.email} · {row.phone}</p>
            <p>{row.message}</p>
            <p className="muted">{row.created_at}</p>
          </article>
        ))}
        {rows.length === 0 && <p className="muted">No contact form messages yet.</p>}
      </div>
    </Dash>
  );
}
