import type { Metadata } from "next";
import { PublicShell } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <PublicShell>
      <section className="wrap" style={{ maxWidth: 800 }}>
        <h1 style={{ fontSize: "3rem" }}>Privacy notice</h1>
        <div className="card" style={{ marginTop: "1rem", display: "grid", gap: "0.8rem" }}>
          <p>Talent Crafters keeps candidate profiles, CVs, applications, and employer records so that recruitment can be managed in one place. The information is used to review accounts, publish approved vacancies, process applications, schedule interviews, and send notifications you have allowed.</p>
          <p>CVs are visible to the candidate, to administrators, and to the recruiter responsible for a vacancy the candidate has applied for. Discovered company emails are stored only when they appear in a public listing or on a page the site permits us to read. Guessed addresses are not created and are not marked verified.</p>
          <p>You may export your candidate record from account settings and you may delete your account. Deletion removes the login, profile, and stored CV. Contact the office if you need a correction to an application that an employer must retain for a hiring decision.</p>
          <p>Passwords are stored as salted hashes. Sessions use an httpOnly cookie. Access to dashboards is limited by role. Administrator actions are written to an audit log.</p>
          <p>This notice is the platform control for POPIA and GDPR-style rights: access, correction, deletion, and objection to optional WhatsApp messages. Email notifications can be switched off in candidate settings. Office contact details are managed by the administrator and should be updated before the site is used publicly.</p>
        </div>
      </section>
    </PublicShell>
  );
}
