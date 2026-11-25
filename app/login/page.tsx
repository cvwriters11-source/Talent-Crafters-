import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/Flash";
import { PublicShell } from "@/components/SiteChrome";
import { SubmitButton } from "@/components/SubmitButton";
import { loginAction } from "@/lib/actions";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const query = await searchParams;
  const next = query.next && query.next.startsWith("/") ? query.next : "";
  return (
    <PublicShell>
      <section className="wrap" style={{ maxWidth: 720, margin: "0 auto" }}>
        <p className="kicker">Account</p>
        <h1 style={{ fontSize: "3.2rem", marginBottom: "1rem" }}>Sign in</h1>
        <Flash error={query.error} />
        <form action={loginAction} className="card" style={{ display: "grid", gap: "0.8rem" }}>
          <input type="hidden" name="next" value={next} />
          <label>Email<input name="email" type="email" required autoComplete="username" /></label>
          <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
          <SubmitButton>Sign in</SubmitButton>
        </form>
        <p style={{ marginTop: "1rem" }}>New candidate? <Link href="/register/candidate">Register</Link></p>
        <p>Hiring company? <Link href="/register/employer">Employer registration</Link></p>
      </section>
    </PublicShell>
  );
}
