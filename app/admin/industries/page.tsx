import { Dash } from "@/components/Dash";
import { Flash } from "@/components/Flash";
import { taxonomyAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { listCategories, listIndustries } from "@/lib/repo";

export const dynamic = "force-dynamic";

function Editor({ title, table, rows }: { title: string; table: string; rows: { id: string; name: string }[] }) {
  return (
    <article className="card">
      <h3>{title}</h3>
      {rows.map((row) => (
        <form key={row.id} action={taxonomyAction} style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", padding: "0.35rem 0" }}>
          <input type="hidden" name="table" value={table} />
          <input type="hidden" name="id" value={row.id} />
          <span>{row.name}</span>
          <button className="btn small ghost" name="intent" value="delete">Remove</button>
        </form>
      ))}
      <form action={taxonomyAction} style={{ display: "flex", gap: "0.4rem", marginTop: "0.6rem" }}>
        <input type="hidden" name="table" value={table} />
        <input name="name" placeholder={`New ${title.toLowerCase()}`} />
        <button className="btn small" name="intent" value="add">Add</button>
      </form>
    </article>
  );
}

export default async function IndustriesPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const user = await requireUser(["admin", "super_admin"]);
  const query = await searchParams;
  return (
    <Dash role={user.role} name={user.email} userId={user.id} title="Industries and categories" path="/admin/industries">
      <Flash notice={query.notice} error={query.error} />
      <div className="grid-2">
        <Editor title="Industries" table="industries" rows={listIndustries()} />
        <Editor title="Categories" table="categories" rows={listCategories()} />
      </div>
    </Dash>
  );
}
