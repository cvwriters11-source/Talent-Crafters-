import Link from "next/link";
import { logoutAction } from "@/lib/actions";
import { unreadCount } from "@/lib/repo";

const links: Record<string, { href: string; label: string }[]> = {
  candidate: [
    { href: "/candidate", label: "Overview" },
    { href: "/candidate/profile", label: "Profile" },
    { href: "/candidate/cv", label: "CV" },
    { href: "/candidate/jobs", label: "Available jobs" },
    { href: "/candidate/saved", label: "Saved jobs" },
    { href: "/candidate/applications", label: "Applications" },
    { href: "/candidate/interviews", label: "Interviews" },
    { href: "/candidate/notifications", label: "Notifications" },
    { href: "/candidate/settings", label: "Settings" },
  ],
  recruiter: [
    { href: "/recruiter", label: "Overview" },
    { href: "/recruiter/profile", label: "Company profile" },
    { href: "/recruiter/jobs", label: "Vacancies" },
    { href: "/recruiter/jobs/new", label: "Post a vacancy" },
    { href: "/recruiter/applicants", label: "Applicants" },
    { href: "/recruiter/notifications", label: "Notifications" },
    { href: "/recruiter/settings", label: "Settings" },
  ],
  admin: [
    { href: "/admin", label: "Overview" },
    { href: "/admin/discovery", label: "AI Job Discovery" },
    { href: "/admin/companies", label: "Companies" },
    { href: "/admin/jobs", label: "Vacancies" },
    { href: "/admin/candidates", label: "Candidates" },
    { href: "/admin/recruiters", label: "Recruiters" },
    { href: "/admin/applications", label: "Applications" },
    { href: "/admin/content", label: "Website content" },
    { href: "/admin/industries", label: "Industries" },
    { href: "/admin/notifications", label: "Notifications" },
    { href: "/admin/messages", label: "Messages" },
    { href: "/admin/settings", label: "Settings" },
    { href: "/admin/audit", label: "Audit log" },
  ],
};

export function Dash({
  role,
  name,
  userId,
  title,
  path,
  children,
}: {
  role: string;
  name: string;
  userId: string;
  title: string;
  path: string;
  children: React.ReactNode;
}) {
  const group = role === "candidate" ? "candidate" : role === "admin" || role === "super_admin" ? "admin" : "recruiter";
  const unread = unreadCount(userId);
  return (
    <div className="dash">
      <aside className="side">
        <Link href="/" className="brand" style={{ color: "white", marginBottom: "1.2rem" }}>
          <span className="mark">TC</span>
          <span>
            <small>Recruitment</small>
            <strong>Talent Crafters</strong>
          </span>
        </Link>
        {links[group].map((item) => (
          <Link key={item.href} href={item.href} className={path === item.href ? "active" : ""}>
            {item.label}
            {item.label === "Notifications" && unread > 0 ? ` (${unread})` : ""}
          </Link>
        ))}
        <form action={logoutAction} style={{ marginTop: "1rem" }}>
          <button className="btn small light">Sign out</button>
        </form>
      </aside>
      <section className="dash-main">
        <div className="dash-top">
          <div>
            <p className="kicker">{group === "admin" ? "Administration" : group === "candidate" ? "Candidate" : "Employer desk"}</p>
            <h1 style={{ fontSize: "2.2rem" }}>{title}</h1>
          </div>
          <p className="muted">{name}</p>
        </div>
        {children}
      </section>
    </div>
  );
}
