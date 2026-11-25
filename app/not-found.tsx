import Link from "next/link";
import { PublicShell } from "@/components/SiteChrome";

export default function NotFound() {
  return (
    <PublicShell>
      <section className="wrap">
        <h1 style={{ fontSize: "3rem" }}>That page is not available.</h1>
        <p style={{ margin: "0.8rem 0" }}>The vacancy may be unpublished, or the address may be incorrect.</p>
        <Link className="btn" href="/jobs">Back to jobs</Link>
      </section>
    </PublicShell>
  );
}
