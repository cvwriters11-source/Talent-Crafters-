import type { Metadata } from "next";
import { Flash } from "@/components/Flash";
import { PublicShell } from "@/components/SiteChrome";
import { SubmitButton } from "@/components/SubmitButton";
import { contactAction } from "@/lib/actions";
import { content } from "@/lib/repo";

export const metadata: Metadata = { title: "Contact us" };
export const dynamic = "force-dynamic";

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const query = await searchParams;
  const copy = content();
  const whatsapp = copy.whatsapp.replace(/[^\d]/g, "");
  const map = `https://maps.google.com/maps?q=${encodeURIComponent(copy.mapQuery)}&z=14&output=embed`;
  return (
    <PublicShell>
      <section className="page-hero">
        <p className="eyebrow">Contact</p>
        <h1>Speak with the desk.</h1>
      </section>
      <section className="wrap">
        <Flash notice={query.notice} error={query.error} />
        <div className="split">
          <form className="card" action={contactAction} style={{ display: "grid", gap: "0.8rem" }}>
            <h2>Contact form</h2>
            <input className="sr-only" name="company_site" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <div className="field-row">
              <label>Name<input name="name" required /></label>
              <label>Email<input name="email" type="email" required /></label>
            </div>
            <div className="field-row">
              <label>Phone<input name="phone" /></label>
              <label>Subject<input name="subject" required /></label>
            </div>
            <label>Message<textarea name="message" required /></label>
            <SubmitButton>Send message</SubmitButton>
          </form>
          <aside style={{ display: "grid", gap: "0.8rem" }}>
            <article className="card">
              <h3>Direct contact</h3>
              <p><a href={`mailto:${copy.email}`}>{copy.email}</a></p>
              <p><a href={`tel:${copy.phone}`}>{copy.phone}</a></p>
              <p>{copy.address}</p>
              <p style={{ marginTop: "0.6rem" }}><a className="btn small" href={`https://wa.me/${whatsapp}`}>WhatsApp</a></p>
            </article>
            <article className="card">
              <h3>Social</h3>
              <p><a href={copy.linkedin}>LinkedIn</a></p>
              <p><a href={copy.facebook}>Facebook</a></p>
              <p><a href={copy.instagram}>Instagram</a></p>
              <p><a href={copy.x}>X</a></p>
            </article>
          </aside>
        </div>
        <iframe className="map" style={{ marginTop: "1rem" }} title="Office map" src={map} />
      </section>
    </PublicShell>
  );
}
