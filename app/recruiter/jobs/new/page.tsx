import { Dash } from "@/components/Dash";
import { Flash } from "@/components/Flash";
import { JobFields } from "@/components/JobFields";
import { SubmitButton } from "@/components/SubmitButton";
import { postJobAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { getCompanyByOwner, listCategories, listIndustries } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function NewJob({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser(["recruiter", "employer"]);
  const query = await searchParams;
  const company = getCompanyByOwner(user.id);
  return (
    <Dash role={user.role} name={company?.contact_name || user.email} userId={user.id} title="Post a vacancy" path="/recruiter/jobs/new">
      <Flash error={query.error} />
      {user.status !== "active" ? <p className="alert">Approval is required before a vacancy can be submitted.</p> : (
        <form action={postJobAction} className="card" style={{ display: "grid", gap: "1rem" }}>
          <JobFields industries={listIndustries()} categories={listCategories()} job={{ industry: company?.industry || "", country: company?.country || "", city: company?.city || "" }} />
          <SubmitButton>Submit for approval</SubmitButton>
        </form>
      )}
    </Dash>
  );
}
