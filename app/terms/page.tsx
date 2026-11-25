import type { Metadata } from "next";
import { PublicShell } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <PublicShell>
      <section className="wrap" style={{ maxWidth: 800 }}>
        <h1 style={{ fontSize: "3rem" }}>Terms of use</h1>
        <div className="card" style={{ marginTop: "1rem", display: "grid", gap: "0.8rem" }}>
          <p>Talent Crafters Recruitment provides a platform for candidates, recruiters, employers, and administrators. Public vacancies are those an administrator has approved. A listing from the discovery service is not an offer of employment until it is published and you apply.</p>
          <p>Employers are responsible for the accuracy of vacancies they submit. Candidates are responsible for the accuracy of their profile and CV. The discovery service reads permitted public sources, keeps rate limits, and honours robots.txt before it opens a company website.</p>
          <p>Do not upload documents you are not entitled to share. Do not attempt to access another person’s account, applications, or CV.</p>
        </div>
      </section>
    </PublicShell>
  );
}
