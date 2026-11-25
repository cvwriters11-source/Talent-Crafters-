import Link from "next/link";
import { Dash } from "@/components/Dash";
import { SubmitButton } from "@/components/SubmitButton";
import { saveJobAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { listSaved } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const user = await requireUser(["candidate"]);
  const jobs = listSaved(user.id);
  return (
    <Dash role={user.role} name={user.display_name || user.email} userId={user.id} title="Saved jobs" path="/candidate/saved">
      <div className="grid-3">
        {jobs.map((job) => (
          <article key={job.id} className="card">
            <Link href={`/jobs/${job.id}`}><h3>{job.title}</h3></Link>
            <p className="muted">{job.company_name}</p>
            <form action={saveJobAction}>
              <input type="hidden" name="jobId" value={job.id} />
              <SubmitButton className="btn small ghost">Remove</SubmitButton>
            </form>
          </article>
        ))}
        {jobs.length === 0 && <p className="muted">Jobs you save will stay here.</p>}
      </div>
    </Dash>
  );
}
