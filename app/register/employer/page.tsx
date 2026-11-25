import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/Flash";
import { PublicShell } from "@/components/SiteChrome";
import { SubmitButton } from "@/components/SubmitButton";
import { registerEmployerAction } from "@/lib/actions";
import { COUNTRIES } from "@/lib/constants";
import { listIndustries } from "@/lib/repo";

export const metadata: Metadata = { title: "Employer registration" };
export const dynamic = "force-dynamic";

export default async function EmployerRegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  return (
    <PublicShell>
      <section className="wrap" style={{ maxWidth: 860, margin: "0 auto" }}>
        <p className="kicker">Employers and recruiters</p>
        <h1 style={{ fontSize: "3.2rem" }}>Open a hiring desk</h1>
        <p className="muted" style={{ margin: "0.6rem 0 1rem" }}>Job advertisements stay unpublished until an administrator approves them.</p>
        <Flash error={query.error} />
        <form action={registerEmployerAction} className="card" style={{ display: "grid", gap: "0.8rem" }}>
          <label>Account type
            <select name="accountType" defaultValue="recruiter">
              <option value="recruiter">Recruiter</option>
              <option value="employer">Employer</option>
            </select>
          </label>
          <div className="field-row">
            <label>Company name<input name="company" required /></label>
            <label>Recruiter&apos;s full name<input name="contact" required /></label>
          </div>
          <div className="field-row">
            <label>Business email<input name="email" type="email" required /></label>
            <label>Contact number<input name="phone" required /></label>
          </div>
          <div className="field-row">
            <label>Company website<input name="website" type="url" placeholder="https://" /></label>
            <label>Industry
              <select name="industry" required defaultValue=""><option value="">Select</option>{listIndustries().map((item) => <option key={item.id}>{item.name}</option>)}</select>
            </label>
          </div>
          <div className="field-row">
            <label>Country<select name="country" defaultValue=""><option value="">Select</option>{COUNTRIES.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>City<input name="city" /></label>
          </div>
          <label>Company description<textarea name="description" required minLength={20} /></label>
          <label>Password<input name="password" type="password" required minLength={8} /></label>
          <label className="check-grid"><span><input type="checkbox" name="consent" value="yes" required /> I agree to the <Link href="/terms">terms</Link> and <Link href="/privacy">privacy notice</Link>.</span></label>
          <SubmitButton>Submit registration</SubmitButton>
        </form>
      </section>
    </PublicShell>
  );
}
