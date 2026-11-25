import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/Flash";
import { JobPick } from "@/components/JobPick";
import { PublicShell } from "@/components/SiteChrome";
import { SubmitButton } from "@/components/SubmitButton";
import { registerCandidateAction } from "@/lib/actions";
import { COUNTRIES, QUALIFICATIONS } from "@/lib/constants";
import { listIndustries, searchJobs } from "@/lib/repo";

export const metadata: Metadata = { title: "Candidate registration" };
export const dynamic = "force-dynamic";

export default async function CandidateRegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  const industries = listIndustries();
  const openJobs = searchJobs({ pageSize: 40 }, true).rows;
  return (
    <PublicShell>
      <section className="wrap" style={{ maxWidth: 860, margin: "0 auto" }}>
        <p className="kicker">Candidates</p>
        <h1 style={{ fontSize: "3.2rem" }}>Create your profile</h1>
        <p className="muted" style={{ margin: "0.6rem 0 1rem" }}>Only a registered candidate can apply. Choose your field and two open vacancies. When a new role is published in that field, you will get a notification to apply. Accounts stay pending until an administrator approves them.</p>
        <Flash error={query.error} />
        <form action={registerCandidateAction} className="card" style={{ display: "grid", gap: "0.8rem" }}>
          <input className="sr-only" name="website" tabIndex={-1} autoComplete="off" />
          <div className="field-row">
            <label>Name<input name="firstName" required autoComplete="given-name" /></label>
            <label>Surname<input name="surname" required autoComplete="family-name" /></label>
          </div>
          <div className="field-row">
            <label>Phone number<input name="phone" required autoComplete="tel" /></label>
            <label>Email address<input name="email" type="email" required autoComplete="email" /></label>
          </div>
          <div className="field-row">
            <label>Location<input name="location" required placeholder="City or town" autoComplete="address-level2" /></label>
            <label>Password<input name="password" type="password" required minLength={8} /></label>
          </div>
          <div className="field-row">
            <label>Country
              <select name="country" required defaultValue=""><option value="">Select</option>{COUNTRIES.filter((c) => c !== "Remote").map((c) => <option key={c}>{c}</option>)}</select>
            </label>
            <label>Career field
              <select name="career" required defaultValue=""><option value="">Select</option>{industries.map((item) => <option key={item.id}>{item.name}</option>)}</select>
            </label>
          </div>
          <div className="field-row">
            <label>Years of experience<input name="years" type="number" min={0} max={60} required /></label>
            <label>Highest qualification
              <select name="qualification" required defaultValue=""><option value="">Select</option>{QUALIFICATIONS.map((item) => <option key={item}>{item}</option>)}</select>
            </label>
          </div>
          {openJobs.length < 2 ? (
            <p className="muted">Two published vacancies are needed before registration can include applications.</p>
          ) : (
            <JobPick jobs={openJobs.map((job) => ({ id: job.id, title: job.title, company_name: job.company_name, country: job.country, location: job.location, industry: job.industry }))} />
          )}
          <label>CV upload<input name="cv" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required /></label>
          <label className="check-grid"><span><input type="checkbox" name="whatsapp" value="yes" /> Send optional WhatsApp updates when a provider is configured</span></label>
          <label className="check-grid"><span><input type="checkbox" name="consent" value="yes" required /> I agree to the processing of my profile and CV as described in the <Link href="/privacy">privacy notice</Link>.</span></label>
          <SubmitButton>Submit registration</SubmitButton>
        </form>
      </section>
    </PublicShell>
  );
}
