import Link from "next/link";
import type { ReactNode, SVGProps } from "react";
import { logoutAction } from "@/lib/actions";
import { unreadCount } from "@/lib/repo";

type IconName =
  | "dashboard"
  | "search"
  | "building"
  | "briefcase"
  | "users"
  | "user"
  | "file"
  | "pen"
  | "layers"
  | "bell"
  | "chat"
  | "gear"
  | "clipboard"
  | "profile"
  | "bookmark";

const links: Record<string, { href: string; label: string; icon: IconName }[]> = {
  candidate: [
    { href: "/candidate", label: "Dashboard", icon: "dashboard" },
    { href: "/candidate/profile", label: "Profile", icon: "profile" },
    { href: "/candidate/cv", label: "CV", icon: "file" },
    { href: "/candidate/jobs", label: "Available jobs", icon: "briefcase" },
    { href: "/candidate/saved", label: "Saved jobs", icon: "bookmark" },
    { href: "/candidate/applications", label: "Applications", icon: "file" },
    { href: "/candidate/interviews", label: "Interviews", icon: "chat" },
    { href: "/candidate/notifications", label: "Notifications", icon: "bell" },
    { href: "/candidate/settings", label: "Settings", icon: "gear" },
  ],
  recruiter: [
    { href: "/recruiter", label: "Dashboard", icon: "dashboard" },
    { href: "/recruiter/profile", label: "Company profile", icon: "building" },
    { href: "/recruiter/jobs", label: "Vacancies", icon: "briefcase" },
    { href: "/recruiter/jobs/new", label: "Post a vacancy", icon: "pen" },
    { href: "/recruiter/applicants", label: "Applicants", icon: "users" },
    { href: "/recruiter/notifications", label: "Notifications", icon: "bell" },
    { href: "/recruiter/settings", label: "Settings", icon: "gear" },
  ],
  admin: [
    { href: "/admin", label: "Dashboard", icon: "dashboard" },
    { href: "/admin/discovery", label: "AI Job Discovery", icon: "search" },
    { href: "/admin/companies", label: "Companies", icon: "building" },
    { href: "/admin/jobs", label: "Job posts", icon: "briefcase" },
    { href: "/admin/candidates", label: "Job seekers", icon: "users" },
    { href: "/admin/recruiters", label: "Recruiters", icon: "user" },
    { href: "/admin/applications", label: "Applications", icon: "file" },
    { href: "/admin/content", label: "Website content", icon: "pen" },
    { href: "/admin/industries", label: "Industries", icon: "layers" },
    { href: "/admin/notifications", label: "Notifications", icon: "bell" },
    { href: "/admin/messages", label: "Messages", icon: "chat" },
    { href: "/admin/settings", label: "Settings", icon: "gear" },
    { href: "/admin/audit", label: "Audit log", icon: "clipboard" },
  ],
};

function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  const shared = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
  if (name === "dashboard") {
    return (
      <svg {...shared}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  if (name === "search") {
    return (
      <svg {...shared}>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
    );
  }
  if (name === "building") {
    return (
      <svg {...shared}>
        <path d="M4 21V5a2 2 0 0 1 2-2h7v18" />
        <path d="M13 9h5a2 2 0 0 1 2 2v10" />
        <path d="M8 7h2M8 11h2M8 15h2M16 13h2M16 17h2" />
      </svg>
    );
  }
  if (name === "briefcase") {
    return (
      <svg {...shared}>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
      </svg>
    );
  }
  if (name === "users") {
    return (
      <svg {...shared}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="3" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  if (name === "user" || name === "profile") {
    return (
      <svg {...shared}>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 20v-1.2A5 5 0 0 1 10 14h4a5 5 0 0 1 5 4.8V20" />
      </svg>
    );
  }
  if (name === "file") {
    return (
      <svg {...shared}>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5M8 13h8M8 17h6" />
      </svg>
    );
  }
  if (name === "pen") {
    return (
      <svg {...shared}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z" />
      </svg>
    );
  }
  if (name === "layers") {
    return (
      <svg {...shared}>
        <path d="M12 3l9 5-9 5-9-5 9-5z" />
        <path d="M3 12l9 5 9-5M3 17l9 5 9-5" />
      </svg>
    );
  }
  if (name === "bell") {
    return (
      <svg {...shared}>
        <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 7H3s3 0 3-7" />
        <path d="M10 19a2 2 0 0 0 4 0" />
      </svg>
    );
  }
  if (name === "chat") {
    return (
      <svg {...shared}>
        <path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 1 1 18 0z" />
      </svg>
    );
  }
  if (name === "gear") {
    return (
      <svg {...shared}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      </svg>
    );
  }
  if (name === "bookmark") {
    return (
      <svg {...shared}>
        <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3-6 3V5a1 1 0 0 1 1-1z" />
      </svg>
    );
  }
  return (
    <svg {...shared}>
      <path d="M8 6h11M8 12h11M8 18h11" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  );
}

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
  children: ReactNode;
}) {
  const group = role === "candidate" ? "candidate" : role === "admin" || role === "super_admin" ? "admin" : "recruiter";
  const unread = unreadCount(userId);
  const notifyHref = group === "admin" ? "/admin/notifications" : group === "candidate" ? "/candidate/notifications" : "/recruiter/notifications";
  const roleLabel = group === "admin" ? "Admin" : group === "candidate" ? "Candidate" : "Recruiter";
  return (
    <div className="dash">
      <aside className="side">
        <Link href="/" className="side-brand">
          <span className="mark">TC</span>
          <span>
            <small>Recruitment</small>
            <strong>Talent Crafters</strong>
          </span>
        </Link>
        <nav className="side-nav" aria-label="Dashboard">
          {links[group].map((item) => (
            <Link key={item.href} href={item.href} className={path === item.href ? "active" : ""}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.icon === "bell" && unread > 0 ? <em className="nav-count">{unread}</em> : null}
            </Link>
          ))}
        </nav>
        <div className="side-user">
          <span className="avatar" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
          <span className="side-user-copy">
            <strong title={name}>{name}</strong>
            <small>{roleLabel}</small>
          </span>
        </div>
        <form action={logoutAction}>
          <button className="side-signout" type="submit">Sign out</button>
        </form>
      </aside>
      <section className="dash-main">
        <div className="dash-top">
          <h1>{title}</h1>
          <Link href={notifyHref} className="bell" aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}>
            <Icon name="bell" />
            {unread > 0 ? <span>{unread}</span> : null}
          </Link>
        </div>
        {children}
      </section>
    </div>
  );
}
