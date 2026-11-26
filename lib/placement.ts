import { all, one } from "./db";
import { deliverEmail, notify } from "./notify";
import {
  adminIds,
  audit,
  createApplication,
  getCandidate,
  getCompany,
  getJob,
  updateJob,
} from "./repo";

function mailbox(value: string | null | undefined) {
  return Boolean(value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
}

export function companyHasEmail(company: { hr_email?: string | null; recruitment_email?: string | null; general_email?: string | null } | null | undefined) {
  if (!company) return false;
  return mailbox(company.hr_email) || mailbox(company.recruitment_email) || mailbox(company.general_email);
}

export function publishEmailedJobs() {
  const rows = all<{ id: string }>(
    `SELECT j.id
     FROM jobs j JOIN companies c ON c.id = j.company_id
     WHERE j.status = 'pending'
       AND (
         c.hr_email LIKE '%_@_%._%'
         OR c.recruitment_email LIKE '%_@_%._%'
         OR c.general_email LIKE '%_@_%._%'
       )`,
  );
  const published: string[] = [];
  for (const row of rows) {
    const company = getCompany(getJob(row.id)?.company_id || "");
    if (!companyHasEmail(company)) continue;
    updateJob(row.id, { status: "published" });
    audit(null, "auto_publish", "job", row.id, "Published because the company has an email address");
    published.push(row.id);
  }
  return published;
}

function fits(profile: { career_field: string; country: string }, job: { industry: string | null; category: string | null; title: string; country: string | null }) {
  const field = profile.career_field.trim().toLowerCase();
  if (field.length < 3) return false;
  const industry = (job.industry || "").toLowerCase();
  const category = (job.category || "").toLowerCase();
  const title = job.title.toLowerCase();
  const careerMatch = field === industry || field === category || industry.includes(field) || title.includes(field) || (category.length > 3 && field.includes(category));
  if (!careerMatch) return false;
  const home = profile.country.trim().toLowerCase();
  const place = (job.country || "").trim().toLowerCase();
  if (!home || !place || place === "remote" || home === place) return true;
  return false;
}

export async function applyFittingCandidates(jobIds: string[]) {
  let applications = 0;
  const people = all<{ id: string; full_name: string; cv_path: string | null; cv_original_name: string | null; country: string; career_field: string }>(
    `SELECT u.id, cp.full_name, cp.cv_path, cp.cv_original_name, cp.country, cp.career_field
     FROM users u JOIN candidate_profiles cp ON cp.user_id = u.id
     WHERE u.role = 'candidate' AND u.status IN ('active', 'pending')`,
  );
  for (const jobId of jobIds) {
    const job = getJob(jobId);
    if (!job || job.status !== "published") continue;
    const company = getCompany(job.company_id);
    if (!companyHasEmail(company)) continue;
    for (const person of people) {
      if (!person.cv_path || !fits(person, job)) continue;
      const already = one("SELECT 1 AS ok FROM applications WHERE job_id = ? AND candidate_user_id = ?", [job.id, person.id]);
      if (already) continue;
      const address = [company?.recruitment_email, company?.hr_email, company?.general_email].find(mailbox);
      if (!address) continue;
      try {
        const delivery = await deliverEmail(
          address,
          `${person.full_name} applied for ${job.title}`,
          `${person.full_name} (${person.career_field}, ${person.country}) asked Talent Crafters to apply for ${job.title}.\nTheir CV is on file with Talent Crafters Recruitment.`,
        );
        const id = createApplication({
          jobId: job.id,
          userId: person.id,
          cvPath: person.cv_path,
          cvName: person.cv_original_name,
          note: `Applied automatically because the role matches the registered career field. Company email ${address}: ${delivery}.`,
        });
        applications += 1;
        await notify({
          userId: person.id,
          title: "Application sent",
          body: `We applied you for ${job.title} at ${job.company_name} because it matches ${person.career_field}. Company email ${address}: ${delivery === "sent" ? "sent" : "recorded, email delivery is not configured yet"}.`,
          href: `/candidate/applications/${id}`,
        });
      } catch {
        continue;
      }
    }
  }
  if (applications > 0) {
    for (const admin of adminIds()) {
      await notify({
        userId: admin.id,
        title: "Automatic applications",
        body: `${applications} ${applications === 1 ? "application was" : "applications were"} lodged for registered candidates on roles that match their field.`,
        href: "/admin/applications",
      });
    }
  }
  return applications;
}

export async function applyForCandidate(userId: string) {
  const profile = getCandidate(userId);
  if (!profile?.cv_path) return 0;
  const jobs = all<{ id: string }>(
    `SELECT j.id FROM jobs j
     JOIN companies c ON c.id = j.company_id
     WHERE j.status = 'published'
       AND (
         c.hr_email LIKE '%_@_%._%'
         OR c.recruitment_email LIKE '%_@_%._%'
         OR c.general_email LIKE '%_@_%._%'
       )
       AND NOT EXISTS (SELECT 1 FROM applications a WHERE a.job_id = j.id AND a.candidate_user_id = ?)`,
    [userId],
  );
  return applyFittingCandidates(jobs.map((job) => job.id));
}
