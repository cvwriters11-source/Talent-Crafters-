import Link from "next/link";
import { logoutAction } from "@/lib/actions";
import { getCurrentUser, homeForRole } from "@/lib/auth";
import { content } from "@/lib/repo";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const copy = content();
  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <span className="mark">TC</span>
        <span>
          <small>Recruitment</small>
          <strong>Talent Crafters</strong>
        </span>
      </Link>
      <input id="nav-toggle" className="nav-toggle" type="checkbox" />
      <label className="nav-button" htmlFor="nav-toggle">Menu</label>
      <nav className="nav">
        <Link href="/jobs">Jobs</Link>
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/register/employer">Employers</Link>
        {user ? (
          <>
            <Link href={homeForRole(user.role)}>Dashboard</Link>
            <form action={logoutAction}><button className="btn small ghost">Sign out</button></form>
          </>
        ) : (
          <>
            <Link href="/login">Sign in</Link>
            <Link className="btn small" href="/register/candidate">Register</Link>
          </>
        )}
      </nav>
      <span className="sr-only">{copy.email}</span>
    </header>
  );
}

export async function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}

export function SiteFooter() {
  const copy = content();
  const whatsapp = copy.whatsapp.replace(/[^\d]/g, "");
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <h3>Talent Crafters Recruitment</h3>
          <p>A recruitment desk for candidates, employers, and the administrators who approve every public vacancy.</p>
        </div>
        <div>
          <h3>Visit</h3>
          <p>{copy.address}</p>
          <p style={{ marginTop: "0.6rem" }}><a href={`mailto:${copy.email}`}>{copy.email}</a></p>
          <p><a href={`tel:${copy.phone}`}>{copy.phone}</a></p>
        </div>
        <div>
          <h3>Explore</h3>
          <p><Link href="/jobs">Open vacancies</Link></p>
          <p><Link href="/about">About the practice</Link></p>
          <p><Link href="/privacy">Privacy</Link></p>
          <p><Link href="/terms">Terms</Link></p>
        </div>
        <div>
          <h3>Connect</h3>
          <p><a href={copy.linkedin}>LinkedIn</a></p>
          <p><a href={copy.facebook}>Facebook</a></p>
          <p><a href={copy.instagram}>Instagram</a></p>
          <p><a href={copy.x}>X</a></p>
          <p><a href={`https://wa.me/${whatsapp}`}>WhatsApp</a></p>
        </div>
      </div>
      <div className="legal">
        <span>© {new Date().getFullYear()} Talent Crafters Recruitment</span>
        <span>Vacancies are published only after administrator approval.</span>
      </div>
    </footer>
  );
}
