import type { Metadata } from "next";
import { PublicShell } from "@/components/SiteChrome";
import { content } from "@/lib/repo";

export const metadata: Metadata = { title: "About us" };
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const copy = content();
  return (
    <PublicShell>
      <section className="page-hero">
        <p className="eyebrow">About us</p>
        <h1>A careful recruitment practice.</h1>
      </section>
      <section className="wrap">
        <div className="grid-2">
          <div>
            <p className="kicker">Introduction</p>
            <h2>Company introduction</h2>
            <p style={{ marginTop: "1rem" }}>{copy.about}</p>
          </div>
          <img src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80" alt="Professionals walking through a corporate lobby" style={{ width: "100%", height: "360px", objectFit: "cover" }} />
        </div>
        <div className="grid-2" style={{ marginTop: "2rem" }}>
          <article className="card"><p className="kicker">Mission</p><h3>Our mission</h3><p>{copy.mission}</p></article>
          <article className="card"><p className="kicker">Vision</p><h3>Our vision</h3><p>{copy.vision}</p></article>
        </div>
        <article className="card" style={{ marginTop: "1rem" }}>
          <p className="kicker">Philosophy</p>
          <h3>Our recruitment philosophy</h3>
          <p>{copy.philosophy}</p>
        </article>
        <div style={{ marginTop: "2rem" }}>
          <p className="kicker">Services</p>
          <h2>Our services</h2>
          <div className="grid-4" style={{ marginTop: "1rem" }}>
            {copy.services.map((service) => (
              <article key={service.title} className="card"><h3>{service.title}</h3><p className="muted">{service.text}</p></article>
            ))}
          </div>
        </div>
        <article className="card" style={{ marginTop: "1.4rem" }}>
          <p className="kicker">Commitment</p>
          <h3>Our commitment to employers and candidates</h3>
          <p>{copy.commitment}</p>
        </article>
        <div style={{ marginTop: "1.4rem" }}>
          <p className="kicker">Values</p>
          <h2>Our values</h2>
          <div className="grid-4" style={{ marginTop: "1rem" }}>
            {copy.values.map((value) => (
              <article key={value.title} className="card"><h3>{value.title}</h3><p className="muted">{value.text}</p></article>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
