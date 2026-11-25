import Link from "next/link";
import { LogoRail } from "@/components/LogoRail";
import { PublicShell } from "@/components/SiteChrome";
import { COUNTRIES } from "@/lib/constants";
import { content, featuredEmployers, listCategories, listIndustries, listTestimonials, searchJobs } from "@/lib/repo";

export const dynamic = "force-dynamic";

const photos = [
  "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=900&q=80",
];

export default async function HomePage() {
  const copy = content();
  const jobs = searchJobs({ pageSize: 6 }, true).rows;
  const employers = featuredEmployers();
  const industries = listIndustries();
  const categories = listCategories();
  const quotes = listTestimonials(true);
  return (
    <PublicShell>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Talent Crafters · Recruitment</p>
          <h1>
            {copy.heroHeadline.replace(/\.$/, "").split(" ").slice(0, -1).join(" ")}{" "}
            <span>{copy.heroHeadline.replace(/\.$/, "").split(" ").slice(-1)[0]}.</span>
          </h1>
          <p className="lede">{copy.heroSubtext}</p>
          <div className="hero-actions">
            <Link className="btn" href="/jobs">Browse vacancies</Link>
            <Link className="btn ghost" href="/register/candidate">Join as a candidate</Link>
          </div>
          <form className="search-card" action="/jobs">
            <input name="q" placeholder="Job title or keyword" aria-label="Keyword" />
            <select name="country" aria-label="Location" defaultValue="">
              <option value="">Any location</option>
              {COUNTRIES.map((country) => <option key={country}>{country}</option>)}
            </select>
            <select name="category" aria-label="Category" defaultValue="">
              <option value="">Any category</option>
              {categories.map((category) => <option key={category.id}>{category.name}</option>)}
            </select>
            <button className="btn">Search jobs</button>
          </form>
        </div>
        <div className="hero-photos" role="img" aria-label="A quiet executive office at night" />
      </section>

      <LogoRail />

      <section className="section">
        <div className="section-head">
          <div>
            <p className="kicker">Open roles</p>
            <h2>Latest available jobs</h2>
            <p className="muted">Only a registered candidate can apply. When you join, choose two of these roles. New vacancies in your field will notify you to apply.</p>
          </div>
          <Link href="/jobs">View all</Link>
        </div>
        {jobs.length === 0 ? (
          <div className="card">
            <h3>Vacancies appear here after review</h3>
            <p className="muted">Discovered and employer-submitted roles stay in the administrator queue until they are approved and published.</p>
          </div>
        ) : (
          <div className="grid-3">
            {jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="card job-card">
                <p className="kicker">{job.company_name}</p>
                <h3>{job.title}</h3>
                <div className="meta">
                  <span className="pill">{job.country || job.location || "Location advertised in the listing"}</span>
                  <span className="pill">{job.employment_type}</span>
                </div>
                <p className="muted">{job.salary_text || "Salary not advertised"}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="section alt">
        <div className="section-head">
          <div>
            <p className="kicker">Employers</p>
            <h2>Featured employers</h2>
          </div>
        </div>
        {employers.length === 0 ? (
          <p className="muted">Employer profiles are shown when they have a published vacancy.</p>
        ) : (
          <div className="grid-3">
            {employers.map((company) => (
              <article key={company.id} className="card">
                <p className="kicker">{company.industry || "Employer"}</p>
                <h3>{company.name}</h3>
                <p className="muted">{company.city ? `${company.city}, ` : ""}{company.country || "Location on the vacancy"}</p>
                <p style={{ marginTop: "0.6rem" }}>{company.vacancy_count} published {company.vacancy_count === 1 ? "vacancy" : "vacancies"}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <p className="kicker">Industries</p>
            <h2>Browse jobs by industry</h2>
          </div>
        </div>
        <div className="grid-4">
          {industries.slice(0, 8).map((industry, index) => (
            <Link
              key={industry.id}
              href={`/jobs?industry=${encodeURIComponent(industry.name)}`}
              className="industry-tile"
              style={{ ["--photo" as string]: `url(${photos[index % photos.length]})` }}
            >
              {industry.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="section alt">
        <div className="grid-2">
          <div>
            <p className="kicker">Why Talent Crafters</p>
            <h2>A recruitment desk that shows its working.</h2>
            <div className="grid-2" style={{ marginTop: "1.2rem", gridTemplateColumns: "1fr 1fr" }}>
              {copy.values.map((value) => (
                <article key={value.title}>
                  <h3 style={{ fontSize: "1.5rem" }}>{value.title}</h3>
                  <p className="muted">{value.text}</p>
                </article>
              ))}
            </div>
          </div>
          <img src={photos[1]} alt="A professional in conversation during an interview" style={{ width: "100%", height: "460px", objectFit: "cover" }} />
        </div>
      </section>

      <section className="section">
        <p className="kicker">Process</p>
        <h2>How our recruitment process works</h2>
        <div className="steps" style={{ marginTop: "1.4rem" }}>
          <article className="step"><span className="kicker">01</span><strong>Register</strong><p className="muted">Candidates and employers create separate accounts. An administrator approves access.</p></article>
          <article className="step"><span className="kicker">02</span><strong>Discover</strong><p className="muted">The discovery service reads permitted public listings and company contact details that are actually published.</p></article>
          <article className="step"><span className="kicker">03</span><strong>Approve</strong><p className="muted">Nothing reaches the public jobs page until an administrator has checked it.</p></article>
          <article className="step"><span className="kicker">04</span><strong>Apply and track</strong><p className="muted">Candidates apply with their CV and follow each status through to interview.</p></article>
        </div>
      </section>

      <section className="photo-band" style={{ padding: "0 6vw 4rem" }}>
        <img src={photos[3]} alt="Colleagues meeting around a table" />
        <img src={photos[2]} alt="A quiet modern office interior" />
        <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80" alt="A diverse team working together" />
      </section>

      <section className="section alt">
        <p className="kicker">Voices</p>
        <h2>Testimonials</h2>
        <div className="grid-3" style={{ marginTop: "1.2rem" }}>
          {quotes.map((quote) => (
            <blockquote key={quote.id} className="card">
              <p className="quote">“{quote.quote}”</p>
              <p style={{ marginTop: "1rem" }}><strong>{quote.name}</strong></p>
              <p className="muted">{quote.role}</p>
            </blockquote>
          ))}
        </div>
        <p className="muted" style={{ marginTop: "0.8rem" }}>Sample quotations until consented client testimonials are added in the content desk.</p>
      </section>

      <section className="cta-split">
        <Link href="/register/candidate">
          <p className="kicker">Candidates</p>
          <h2>Bring your experience into one profile.</h2>
          <span className="btn">Create a candidate account</span>
        </Link>
        <Link href="/register/employer">
          <p className="kicker">Employers</p>
          <h2>Submit vacancies for a reviewed release.</h2>
          <span className="btn ghost">Register your company</span>
        </Link>
      </section>
    </PublicShell>
  );
}
