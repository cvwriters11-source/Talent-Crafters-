import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { exec, one, timestamp } from "./db";
import { getUserById, type UserRow } from "./repo";

export function homeForRole(role: string) {
  if (role === "candidate") return "/candidate";
  if (role === "recruiter" || role === "employer") return "/recruiter";
  return "/admin";
}

export async function createSession(userId: string) {
  const id = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");
  exec("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)", [id, userId, expires, timestamp()]);
  const jar = await cookies();
  jar.set("tc_session", id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 14 * 24 * 60 * 60,
  });
}

export async function clearSession() {
  const jar = await cookies();
  const token = jar.get("tc_session")?.value;
  if (token) exec("DELETE FROM sessions WHERE id = ?", [token]);
  jar.delete("tc_session");
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get("tc_session")?.value;
  if (!token) return null;
  const session = one<{ user_id: string }>("SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?", [token, timestamp()]);
  if (!session) return null;
  const user = getUserById(session.user_id);
  if (!user || user.status === "suspended") return null;
  return user;
}

export async function requireUser(roles?: string[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect(homeForRole(user.role));
  return user as UserRow & { display_name: string };
}

export function isStaff(role: string) {
  return role === "admin" || role === "super_admin";
}
