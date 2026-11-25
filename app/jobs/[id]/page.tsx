import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash } from "@/components/Flash";
import { PublicShell } from "@/components/SiteChrome";
import { SubmitButton } from "@/components/SubmitButton";
import { applyAction, saveJobAction } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/constants";
import { getCandidate, getJob, isSaved } from "@/lib/repo";

export const dynamic = "force-dynamic";

const COUNTRY_CODES: Record<string, string> = {
  "south africa": "ZA",
  nigeria: "NG",
  kenya: "KE",
  ghana: "GH",
  egypt: "EG",
  "united kingdom": "GB",
  uk: "GB",
  ireland: "IE",
  germany: "DE",
  netherlands: "NL",
  france: "FR",
  "united states": "US",
  "united states of america": "US",
  usa: "US",
  canada: "CA",
  "united arab emirates": "AE",
  uae: "AE",
  australia: "AU",
  "new zealand": "NZ",
  india: "IN",
  singapore: "SG",
  argentina: "AR",
};

function countryCode(country: string) {
  return COUNTRY_CODES[country.trim().toLowerCase()] || "";
}

function publishedStamp(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  const zone = "Africa/Johannesburg";
  return {
    date: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: zone }).format(parsed),
    time: new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: zone }).format(parsed),
  };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const job = getJob((await params).id);
  return { title: job?.title || "Vacancy" };
}

export default async function JobPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const job = getJob(id);
  const user = await getCurrentUser();
  if (!job || (job.status !== "published" && user?.role !== "admin" && user?.role !== "super_admin" && user?.id !== job?.posted_by)) notFound();
  const saved = user ? isSaved(user.id, job.id) : false;
  const profile = user?.role === "candidate" ? getCandidate(user.id) : null;
  const posted = publishedStamp(job.published_at || job.created_at);
  const country = job.country || job.location || "";
  const flag = country && country.toLowerCase() !== "remote" ? countryCode(country) : "";
  return (
    <PublicShell>
      <section className="wrap">
        <Flash error={query.error} />
        <p className="kicker"><Link href="/jobs">Vacancies</Link> / {job.company_name}</p>
        <div className="section-head">
          <div>
            <h1 style={{ fontSize: "clamp(2.4rem, 4vw, 4rem)" }}>{job.title}</h1>
            <p className="job-facts">
              {posted && <span>Published {posted.date}</span>}
              {posted && <span>{posted.time}</span>}
              {country && (
                <span>
                  {flag ? <img className="flag" src={`https://flagcdn.com/w40/${flag.toLowerCase()}.png`} alt="" width={22} height={16} /> : null}
                  {country}
                </span>
              )}
            </p>
          </div>
          {user?.role === "candidate" && job.status === "published" && (
            <form action={saveJobAction}>
              <input type="hidden" name="jobId" value={job.id} />
              <input type="hidden" name="return" value={`/jobs/${job.id}`} />
              <SubmitButton className="btn ghost">{saved ? "Unsave job" : "Save job"}</SubmitButton>
            </form>
          )}
        </div>
        <div className="meta" style={{ margin: "0.8rem 0 1.2rem" }}>
          <span className="pill">{job.company_name}</span>
          <span className="pill">{job.country || job.location || "Location in the description"}</span>
          <span className="pill">{job.employment_type}</span>
          <span className="pill">{job.experience_level}</span>
          <span className="pill">{STATUS_LABELS[job.status] || job.status}</span>
        </div>
        <div style={{ display: "grid", gap: "0.8rem" }}>
          <article className="card" style={{ whiteSpace: "pre-wrap" }}>
            <h2>Job description</h2>
            <p style={{ marginTop: "0.8rem" }}>{job.description}</p>
            {job.requirements && <><h3 style={{ marginTop: "1.2rem" }}>Requirements</h3><p>{job.requirements}</p></>}
            {job.qualifications && <><h3 style={{ marginTop: "1.2rem" }}>Qualifications</h3><p>{job.qualifications}</p></>}
            {job.experience && <p style={{ marginTop: "0.8rem" }}><strong>Experience advertised: </strong>{job.experience}</p>}
          </article>
          {job.status === "published" && (
            <article className="card">
              <h3>Apply</h3>
              {!user && (
                <div style={{ display: "grid", gap: "0.6rem" }}>
                  <p className="muted">Only a registered candidate can apply.</p>
                  <Link className="btn" href="/register/candidate" style={{ width: "100%" }}>Create a candidate account</Link>
                  <Link className="btn ghost" href={`/login?next=/jobs/${job.id}`} style={{ width: "100%" }}>Sign in</Link>
                </div>
              )}
              {user && user.role !== "candidate" && <p className="muted">Applications are submitted from candidate accounts.</p>}
              {user?.role === "candidate" && user.status !== "active" && <p>Your account must be approved before you can apply.</p>}
              {user?.role === "candidate" && user.status === "active" && !profile?.cv_path && <p><Link href="/candidate/cv">Upload a CV</Link> before applying.</p>}
              {user?.role === "candidate" && user.status === "active" && profile?.cv_path && (
                <form action={applyAction} style={{ display: "grid", gap: "0.7rem" }}>
                  <input type="hidden" name="jobId" value={job.id} />
                  <p className="muted">Your saved CV, {profile.cv_original_name}, will be attached.</p>
                  <label>Note to the hiring team<textarea name="note" placeholder="Optional" /></label>
                  <SubmitButton>Apply for this job</SubmitButton>
                </form>
              )}
            </article>
          )}
        </div>
      </section>
    </PublicShell>
  );
}
