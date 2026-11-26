"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clearSession, createSession, homeForRole, requireUser } from "./auth";
import { hashPassword, verifyPassword } from "./db";
import { removeCv, storeCv } from "./files";
import { runDiscovery } from "./discovery";
import { notify } from "./notify";
import {
  addContact,
  addMessage,
  addNamed,
  adminIds,
  audit,
  candidatesForField,
  createApplication,
  createCompany,
  createInterview,
  createJob,
  createUser,
  deleteJob,
  deleteNamed,
  deleteTestimonial,
  deleteUser,
  discoverySettings,
  getApplication,
  getCandidate,
  getCompany,
  getCompanyByOwner,
  getJob,
  getUserByEmail,
  getUserById,
  isSaved,
  listUsers,
  markNotificationsRead,
  saveCandidate,
  saveDiscoverySettings,
  saveJobForUser,
  saveTestimonial,
  setApplicationStatus,
  setSetting,
  setUserStatus,
  unsaveJob,
  updateCompany,
  updateJob,
  updatePassword,
  usersByRole,
  type DiscoverySettings,
} from "./repo";

const attempts = new Map<string, { count: number; reset: number }>();

function clean(value: FormDataEntryValue | null, max = 500) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function multiline(value: FormDataEntryValue | null, max = 20000) {
  return String(value ?? "").replace(/\r/g, "").trim().slice(0, max);
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 160;
}

function validPassword(password: string) {
  return password.length >= 8 && password.length <= 100 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

function safeNext(value: string) {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "";
  return value;
}

function checked(formData: FormData, name: string) {
  return formData.getAll(name).map((item) => String(item)).filter(Boolean);
}

export async function loginAction(formData: FormData) {
  const email = clean(formData.get("email"), 160).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(clean(formData.get("next"), 200));
  const key = email || "unknown";
  const current = attempts.get(key);
  if (current && current.reset > Date.now() && current.count >= 8) redirect("/login?error=rate");
  const user = getUserByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    const prev = attempts.get(key);
    attempts.set(key, { count: (prev && prev.reset > Date.now() ? prev.count : 0) + 1, reset: Date.now() + 15 * 60_000 });
    redirect(`/login?error=auth${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  }
  if (user.status === "suspended") redirect("/login?error=suspended");
  attempts.delete(key);
  await createSession(user.id);
  audit(user.id, "login", "user", user.id, user.role);
  redirect(next || homeForRole(user.role));
}

export async function logoutAction() {
  const user = await requireUser();
  await clearSession();
  audit(user.id, "logout", "user", user.id, "");
  redirect("/");
}

async function lodgeApplication(userId: string, fullName: string, cvPath: string | null, cvName: string | null, jobId: string, note: string) {
  const job = getJob(jobId);
  if (!job || job.status !== "published") return null;
  const id = createApplication({ jobId, userId, cvPath, cvName, note });
  await notify({ userId, title: "Application received", body: `Your application for ${job.title} at ${job.company_name} is pending review.`, href: `/candidate/applications/${id}` });
  const recipients = job.owner_user_id ? [job.owner_user_id] : adminIds().map((admin) => admin.id);
  for (const recipient of recipients) {
    await notify({
      userId: recipient,
      title: "New job application",
      body: `${fullName} applied for ${job.title}.`,
      href: job.owner_user_id ? `/recruiter/applicants/${id}` : `/admin/applications/${id}`,
    });
  }
  return id;
}

export async function registerCandidateAction(formData: FormData) {
  if (clean(formData.get("website"))) redirect("/register/candidate?notice=sent");
  const firstName = clean(formData.get("firstName"), 60);
  const surname = clean(formData.get("surname"), 60);
  const fullName = `${firstName} ${surname}`.trim();
  const email = clean(formData.get("email"), 160).toLowerCase();
  const phone = clean(formData.get("phone"), 40);
  const password = String(formData.get("password") ?? "");
  const country = clean(formData.get("country"), 80);
  const location = clean(formData.get("location"), 120);
  const career = clean(formData.get("career"), 80);
  const years = Number(formData.get("years"));
  const qualification = clean(formData.get("qualification"), 80);
  const file = formData.get("cv");
  const jobIds = [...new Set(formData.getAll("jobs").map((item) => clean(item, 80)))].filter(Boolean);
  if (!firstName || !surname || !validEmail(email) || phone.length < 7 || !validPassword(password) || !country || !location || !career || !qualification) {
    redirect("/register/candidate?error=invalid");
  }
  if (jobIds.length !== 2 || jobIds.some((id) => getJob(id)?.status !== "published")) {
    redirect("/register/candidate?error=jobs");
  }
  if (!Number.isInteger(years) || years < 0 || years > 60) redirect("/register/candidate?error=invalid");
  if (formData.get("consent") !== "yes") redirect("/register/candidate?error=consent");
  if (getUserByEmail(email)) redirect("/register/candidate?error=exists");
  if (!(file instanceof File)) redirect("/register/candidate?error=cv");
  const userId = createUser({ email, passwordHash: hashPassword(password), role: "candidate", status: "pending" });
  try {
    const stored = await storeCv(file, userId);
    saveCandidate({
      user_id: userId,
      full_name: fullName,
      first_name: firstName,
      surname,
      phone,
      country,
      location,
      career_field: career,
      years_experience: years,
      qualification,
      cv_path: stored.relative,
      cv_original_name: stored.name,
      cv_updated_at: new Date().toISOString().slice(0, 19).replace("T", " "),
      bio: null,
      whatsapp_opt_in: formData.get("whatsapp") === "yes" ? 1 : 0,
      email_opt_in: 1,
    });
    for (const jobId of jobIds) {
      await lodgeApplication(userId, fullName, stored.relative, stored.name, jobId, "Chosen during registration");
    }
  } catch (error) {
    deleteUser(userId);
    const message = error instanceof Error ? error.message : "";
    redirect(`/register/candidate?error=${message.includes("5 MB") ? "size" : message.includes("UNIQUE") ? "applied" : "cv"}`);
  }
  const { applyForCandidate } = await import("./placement");
  await applyForCandidate(userId);
  audit(userId, "register", "candidate", userId, email);
  for (const admin of adminIds()) {
    await notify({ userId: admin.id, title: "New candidate registration", body: `${fullName} is waiting for account approval and applied for two vacancies.`, href: "/admin/candidates" });
  }
  await createSession(userId);
  redirect("/candidate?notice=pending");
}

export async function registerEmployerAction(formData: FormData) {
  const company = clean(formData.get("company"), 160);
  const contact = clean(formData.get("contact"), 120);
  const email = clean(formData.get("email"), 160).toLowerCase();
  const phone = clean(formData.get("phone"), 40);
  const website = clean(formData.get("website"), 200);
  const industry = clean(formData.get("industry"), 80);
  const description = multiline(formData.get("description"), 4000);
  const password = String(formData.get("password") ?? "");
  const role = formData.get("accountType") === "employer" ? "employer" : "recruiter";
  if (!company || !contact || !validEmail(email) || phone.length < 7 || !validPassword(password) || !industry || description.length < 20) {
    redirect("/register/employer?error=invalid");
  }
  if (formData.get("consent") !== "yes") redirect("/register/employer?error=consent");
  if (getUserByEmail(email)) redirect("/register/employer?error=exists");
  const userId = createUser({ email, passwordHash: hashPassword(password), role, status: "pending" });
  createCompany({
    name: company,
    source: "registered",
    owner_user_id: userId,
    contact_name: contact,
    industry,
    website: website || null,
    phone,
    description,
    country: clean(formData.get("country"), 80) || null,
    city: clean(formData.get("city"), 80) || null,
    contact_status: "unverified",
    email_status: "unverified",
    general_email: email,
  });
  audit(userId, "register", role, userId, company);
  for (const admin of adminIds()) {
    await notify({ userId: admin.id, title: "New recruiter registration", body: `${company} is waiting for account approval.`, href: "/admin/recruiters" });
  }
  await createSession(userId);
  redirect("/recruiter?notice=pending");
}

export async function updateCandidateAction(formData: FormData) {
  const user = await requireUser(["candidate"]);
  const current = getCandidate(user.id);
  if (!current) redirect("/candidate/profile?error=invalid");
  const firstName = clean(formData.get("firstName"), 60);
  const surname = clean(formData.get("surname"), 60);
  const fullName = `${firstName} ${surname}`.trim();
  const phone = clean(formData.get("phone"), 40);
  const country = clean(formData.get("country"), 80);
  const location = clean(formData.get("location"), 120);
  const career = clean(formData.get("career"), 80);
  const years = Number(formData.get("years"));
  const qualification = clean(formData.get("qualification"), 80);
  if (!firstName || !surname || phone.length < 7 || !country || !location || !career || !qualification || !Number.isInteger(years) || years < 0 || years > 60) {
    redirect("/candidate/profile?error=invalid");
  }
  saveCandidate({
    ...current,
    full_name: fullName,
    first_name: firstName,
    surname,
    phone,
    country,
    location,
    career_field: career,
    years_experience: years,
    qualification,
    bio: multiline(formData.get("bio"), 2000) || null,
    whatsapp_opt_in: formData.get("whatsapp") === "yes" ? 1 : 0,
    email_opt_in: formData.get("emailOpt") === "yes" ? 1 : 0,
  });
  revalidatePath("/candidate");
  redirect("/candidate/profile?notice=saved");
}

export async function uploadCvAction(formData: FormData) {
  const user = await requireUser(["candidate"]);
  const current = getCandidate(user.id);
  if (!current) redirect("/candidate/cv?error=invalid");
  const file = formData.get("cv");
  if (!(file instanceof File)) redirect("/candidate/cv?error=cv");
  try {
    const stored = await storeCv(file, user.id);
    if (current.cv_path) removeCv(current.cv_path);
    saveCandidate({
      ...current,
      cv_path: stored.relative,
      cv_original_name: stored.name,
      cv_updated_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    });
  } catch {
    redirect("/candidate/cv?error=cv");
  }
  redirect("/candidate/cv?notice=saved");
}

export async function saveJobAction(formData: FormData) {
  const user = await requireUser(["candidate"]);
  if (user.status !== "active") redirect("/candidate?notice=pending");
  const jobId = clean(formData.get("jobId"), 80);
  const job = getJob(jobId);
  if (!job || job.status !== "published") redirect("/jobs");
  if (isSaved(user.id, jobId)) unsaveJob(user.id, jobId);
  else saveJobForUser(user.id, jobId);
  revalidatePath("/candidate/saved");
  redirect(clean(formData.get("return"), 200).startsWith("/jobs") ? `/jobs/${jobId}` : "/candidate/saved");
}

export async function applyAction(formData: FormData) {
  const user = await requireUser(["candidate"]);
  if (user.status !== "active") redirect("/candidate?notice=pending");
  const profile = getCandidate(user.id);
  const jobId = clean(formData.get("jobId"), 80);
  const job = getJob(jobId);
  if (!job || job.status !== "published") redirect("/jobs?error=closed");
  if (!profile?.cv_path) redirect("/candidate/cv?error=missing");
  try {
    const id = await lodgeApplication(user.id, profile.full_name, profile.cv_path, profile.cv_original_name, jobId, multiline(formData.get("note"), 2000));
    if (!id) redirect("/jobs?error=closed");
    redirect(`/candidate/applications/${id}?notice=applied`);
  } catch {
    redirect(`/jobs/${jobId}?error=applied`);
  }
}

export async function postJobAction(formData: FormData) {
  const user = await requireUser(["recruiter", "employer"]);
  if (user.status !== "active") redirect("/recruiter?notice=pending");
  const company = getCompanyByOwner(user.id);
  if (!company) redirect("/recruiter?error=company");
  const title = clean(formData.get("title"), 180);
  const description = multiline(formData.get("description"), 20000);
  if (title.length < 3 || description.length < 40) redirect("/recruiter/jobs/new?error=invalid");
  const salaryMin = Number(formData.get("salaryMin"));
  const salaryMax = Number(formData.get("salaryMax"));
  const id = createJob({
    company_id: company.id,
    posted_by: user.id,
    title,
    description,
    requirements: multiline(formData.get("requirements"), 5000) || null,
    qualifications: multiline(formData.get("qualifications"), 3000) || null,
    experience: clean(formData.get("experience"), 120) || null,
    location: clean(formData.get("location"), 120) || null,
    city: clean(formData.get("city"), 80) || null,
    country: clean(formData.get("country"), 80) || null,
    salary_text: clean(formData.get("salaryText"), 120) || null,
    salary_min: Number.isFinite(salaryMin) && salaryMin > 0 ? Math.round(salaryMin) : null,
    salary_max: Number.isFinite(salaryMax) && salaryMax > 0 ? Math.round(salaryMax) : null,
    currency: clean(formData.get("currency"), 8) || null,
    employment_type: clean(formData.get("employment"), 40) || null,
    experience_level: clean(formData.get("level"), 40) || null,
    industry: clean(formData.get("industry"), 80) || company.industry,
    category: clean(formData.get("category"), 80) || null,
    deadline: clean(formData.get("deadline"), 10) || null,
    source_url: null,
    reference_code: clean(formData.get("reference"), 40) || null,
    origin: "recruiter",
    source_name: "Employer submission",
    status: "pending",
  });
  for (const admin of adminIds()) {
    await notify({ userId: admin.id, title: "New job submission", body: `${company.name} submitted ${title} for approval.`, href: `/admin/jobs/${id}` });
  }
  audit(user.id, "submit_job", "job", id, title);
  redirect("/recruiter/jobs?notice=submitted");
}

export async function updateRecruiterJobAction(formData: FormData) {
  const user = await requireUser(["recruiter", "employer"]);
  const job = getJob(clean(formData.get("jobId"), 80));
  if (!job || job.owner_user_id !== user.id) redirect("/recruiter/jobs");
  if (job.status === "expired" || job.status === "archived") redirect(`/recruiter/jobs/${job.id}?error=locked`);
  updateJob(job.id, {
    title: clean(formData.get("title"), 180) || job.title,
    description: multiline(formData.get("description"), 20000) || job.description,
    requirements: multiline(formData.get("requirements"), 5000) || null,
    qualifications: multiline(formData.get("qualifications"), 3000) || null,
    experience: clean(formData.get("experience"), 120) || null,
    location: clean(formData.get("location"), 120) || null,
    city: clean(formData.get("city"), 80) || null,
    country: clean(formData.get("country"), 80) || null,
    salary_text: clean(formData.get("salaryText"), 120) || null,
    employment_type: clean(formData.get("employment"), 40) || null,
    experience_level: clean(formData.get("level"), 40) || null,
    industry: clean(formData.get("industry"), 80) || null,
    category: clean(formData.get("category"), 80) || null,
    deadline: clean(formData.get("deadline"), 10) || null,
    status: job.status === "published" || job.status === "approved" ? "pending" : job.status,
  });
  for (const admin of adminIds()) {
    await notify({ userId: admin.id, title: "Job advertisement updated", body: `${job.title} was edited and needs approval again.`, href: `/admin/jobs/${job.id}` });
  }
  redirect(`/recruiter/jobs/${job.id}?notice=saved`);
}

export async function updateCompanyProfileAction(formData: FormData) {
  const user = await requireUser(["recruiter", "employer"]);
  const company = getCompanyByOwner(user.id);
  if (!company) redirect("/recruiter");
  updateCompany(company.id, {
    contact_name: clean(formData.get("contact"), 120),
    name: clean(formData.get("company"), 160) || company.name,
    industry: clean(formData.get("industry"), 80),
    country: clean(formData.get("country"), 80),
    city: clean(formData.get("city"), 80),
    website: clean(formData.get("website"), 200),
    careers_page: clean(formData.get("careers"), 300),
    phone: clean(formData.get("phone"), 40),
    linkedin_url: clean(formData.get("linkedin"), 300),
    description: multiline(formData.get("description"), 4000),
    hr_email: clean(formData.get("hrEmail"), 160).toLowerCase() || null,
    recruitment_email: clean(formData.get("recruitmentEmail"), 160).toLowerCase() || null,
  });
  redirect("/recruiter/profile?notice=saved");
}

export async function reviewApplicationAction(formData: FormData) {
  const user = await requireUser(["recruiter", "employer", "admin", "super_admin"]);
  const application = getApplication(clean(formData.get("applicationId"), 80));
  if (!application) redirect("/recruiter/applicants");
  const staff = user.role === "admin" || user.role === "super_admin";
  if (!staff && application.owner_user_id !== user.id) redirect("/recruiter/applicants");
  const status = clean(formData.get("status"), 40);
  const allowed = ["pending", "under_review", "shortlisted", "interview", "rejected", "successful"];
  if (!allowed.includes(status)) redirect(`/recruiter/applicants/${application.id}?error=invalid`);
  const note = multiline(formData.get("note"), 1000);
  setApplicationStatus(application.id, status, user.id, note);
  const labels: Record<string, string> = {
    pending: "pending",
    under_review: "under review",
    shortlisted: "shortlisted",
    interview: "moved to interview",
    rejected: "unsuccessful",
    successful: "successful",
  };
  await notify({
    userId: application.candidate_user_id,
    title: "Application status updated",
    body: `Your application for ${application.title} is now ${labels[status]}.`,
    href: `/candidate/applications/${application.id}`,
    whatsapp: status === "shortlisted" || status === "interview" || status === "successful",
  });
  audit(user.id, "application_status", "application", application.id, status);
  const back = staff ? `/admin/applications/${application.id}` : `/recruiter/applicants/${application.id}`;
  redirect(`${back}?notice=saved`);
}

export async function scheduleInterviewAction(formData: FormData) {
  const user = await requireUser(["recruiter", "employer", "admin", "super_admin"]);
  const application = getApplication(clean(formData.get("applicationId"), 80));
  if (!application) redirect("/recruiter");
  const staff = user.role === "admin" || user.role === "super_admin";
  if (!staff && application.owner_user_id !== user.id) redirect("/recruiter");
  const when = clean(formData.get("when"), 30);
  const mode = clean(formData.get("mode"), 20);
  const place = clean(formData.get("place"), 300);
  const message = multiline(formData.get("message"), 2000);
  if (!when || !mode || !place) {
    redirect(`${staff ? "/admin" : "/recruiter"}/applicants/${application.id}?error=invalid`);
  }
  createInterview({ applicationId: application.id, scheduledAt: when.replace("T", " "), mode, place, message, createdBy: user.id });
  setApplicationStatus(application.id, "interview", user.id, message || "Interview scheduled");
  await notify({
    userId: application.candidate_user_id,
    title: "Interview invitation",
    body: `${application.company_name} invited you to a ${mode} interview on ${when.replace("T", " ")}. ${place}`,
    href: "/candidate/interviews",
    whatsapp: true,
  });
  const back = staff ? `/admin/applications/${application.id}` : `/recruiter/applicants/${application.id}`;
  redirect(`${back}?notice=interview`);
}

export async function messageAction(formData: FormData) {
  const user = await requireUser(["candidate", "recruiter", "employer", "admin", "super_admin"]);
  const application = getApplication(clean(formData.get("applicationId"), 80));
  if (!application) redirect("/");
  const staff = user.role === "admin" || user.role === "super_admin";
  const allowed = user.id === application.candidate_user_id || user.id === application.owner_user_id || staff;
  if (!allowed) redirect("/");
  const body = multiline(formData.get("body"), 4000);
  if (body.length < 1) redirect(`/candidate/applications/${application.id}?error=invalid`);
  addMessage(application.id, user.id, body);
  const recipient = user.id === application.candidate_user_id ? application.owner_user_id : application.candidate_user_id;
  if (recipient) {
    const href = recipient === application.candidate_user_id ? `/candidate/applications/${application.id}` : `/recruiter/applicants/${application.id}`;
    await notify({ userId: recipient, title: "New message about an application", body: body.slice(0, 180), href });
  } else {
    for (const admin of adminIds()) {
      if (admin.id !== user.id) await notify({ userId: admin.id, title: "Candidate message", body: body.slice(0, 180), href: `/admin/applications/${application.id}` });
    }
  }
  const href = user.role === "candidate" ? `/candidate/applications/${application.id}` : staff ? `/admin/applications/${application.id}` : `/recruiter/applicants/${application.id}`;
  redirect(`${href}?notice=sent`);
}

export async function setAccountStatusAction(formData: FormData) {
  const actor = await requireUser(["admin", "super_admin"]);
  const user = getUserById(clean(formData.get("userId"), 80));
  const status = clean(formData.get("status"), 20);
  if (!user || !["active", "rejected", "suspended", "pending"].includes(status)) redirect("/admin");
  if (user.role === "super_admin" && actor.role !== "super_admin") redirect("/admin/recruiters?error=forbidden");
  if (user.id === actor.id) redirect("/admin?error=self");
  setUserStatus(user.id, status);
  audit(actor.id, "account_status", "user", user.id, status);
  await notify({
    userId: user.id,
    title: status === "active" ? "Your account is approved" : `Account ${status}`,
    body: status === "active" ? "You can now use your Talent Crafters dashboard." : `An administrator marked your account as ${status}.`,
    href: homeForRole(user.role),
  });
  redirect(user.role === "candidate" ? "/admin/candidates?notice=saved" : "/admin/recruiters?notice=saved");
}

export async function moderateJobAction(formData: FormData) {
  const actor = await requireUser(["admin", "super_admin"]);
  const job = getJob(clean(formData.get("jobId"), 80));
  const decision = clean(formData.get("decision"), 20);
  if (!job) redirect("/admin/jobs");
  if (decision === "delete") {
    const removed = deleteJob(job.id);
    if (!removed) redirect(`/admin/jobs/${job.id}?error=applications`);
    audit(actor.id, "delete_job", "job", job.id, job.title);
    redirect("/admin/jobs?notice=deleted");
  }
  const statusMap: Record<string, string> = {
    approve: "approved",
    publish: "published",
    unpublish: "unpublished",
    reject: "rejected",
    archive: "archived",
    expire: "expired",
  };
  const status = statusMap[decision];
  if (!status) redirect(`/admin/jobs/${job.id}`);
  const reason = multiline(formData.get("reason"), 500);
  updateJob(job.id, { status, rejection_reason: decision === "reject" ? reason : job.rejection_reason });
  audit(actor.id, "job_status", "job", job.id, status);
  if (job.posted_by) {
    await notify({
      userId: job.posted_by,
      title: status === "published" ? "Job approved and published" : `Job ${status}`,
      body: `${job.title} is now ${status}.`,
      href: `/recruiter/jobs/${job.id}`,
    });
  }
  if (status === "published") {
    const matches = candidatesForField(job.industry || "", job.category || "", job.id);
    for (const candidate of matches) {
      await notify({
        userId: candidate.id,
        title: "New job in your field",
        body: `${job.title} at ${job.company_name} matches the field you chose. Open it to apply.`,
        href: `/jobs/${job.id}`,
        email: candidate.email_opt_in === 1,
      });
    }
  }
  revalidatePath("/jobs");
  redirect(`/admin/jobs/${job.id}?notice=saved`);
}

export async function editJobAction(formData: FormData) {
  const actor = await requireUser(["admin", "super_admin"]);
  const job = getJob(clean(formData.get("jobId"), 80));
  if (!job) redirect("/admin/jobs");
  const salaryMin = Number(formData.get("salaryMin"));
  const salaryMax = Number(formData.get("salaryMax"));
  updateJob(job.id, {
    title: clean(formData.get("title"), 180) || job.title,
    description: multiline(formData.get("description"), 20000) || job.description,
    requirements: multiline(formData.get("requirements"), 5000) || null,
    qualifications: multiline(formData.get("qualifications"), 3000) || null,
    experience: clean(formData.get("experience"), 120) || null,
    location: clean(formData.get("location"), 120) || null,
    city: clean(formData.get("city"), 80) || null,
    country: clean(formData.get("country"), 80) || null,
    salary_text: clean(formData.get("salaryText"), 120) || null,
    salary_min: Number.isFinite(salaryMin) && salaryMin > 0 ? Math.round(salaryMin) : null,
    salary_max: Number.isFinite(salaryMax) && salaryMax > 0 ? Math.round(salaryMax) : null,
    currency: clean(formData.get("currency"), 8) || null,
    employment_type: clean(formData.get("employment"), 40) || null,
    experience_level: clean(formData.get("level"), 40) || null,
    industry: clean(formData.get("industry"), 80) || null,
    category: clean(formData.get("category"), 80) || null,
    deadline: clean(formData.get("deadline"), 10) || null,
    source_url: clean(formData.get("sourceUrl"), 500) || null,
    reference_code: clean(formData.get("reference"), 40) || null,
  });
  const company = getCompany(job.company_id);
  if (company && company.source === "discovered") {
    updateCompany(company.id, {
      name: clean(formData.get("companyName"), 160) || company.name,
      website: clean(formData.get("website"), 300) || null,
      careers_page: clean(formData.get("careers"), 300) || null,
      hr_email: clean(formData.get("hrEmail"), 160).toLowerCase() || null,
      recruitment_email: clean(formData.get("recruitmentEmail"), 160).toLowerCase() || null,
      general_email: clean(formData.get("generalEmail"), 160).toLowerCase() || null,
      phone: clean(formData.get("phone"), 40) || null,
      linkedin_url: clean(formData.get("linkedin"), 300) || null,
      country: clean(formData.get("country"), 80) || null,
      city: clean(formData.get("city"), 80) || null,
      industry: clean(formData.get("industry"), 80) || null,
      email_status: clean(formData.get("emailStatus"), 20) || company.email_status,
      contact_status: clean(formData.get("contactStatus"), 20) || company.contact_status,
      last_verified_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    });
  }
  audit(actor.id, "edit_job", "job", job.id, job.title);
  redirect(`/admin/jobs/${job.id}?notice=saved`);
}

export async function editCompanyAction(formData: FormData) {
  const actor = await requireUser(["admin", "super_admin"]);
  const company = getCompany(clean(formData.get("companyId"), 80));
  if (!company) redirect("/admin/companies");
  updateCompany(company.id, {
    name: clean(formData.get("name"), 160) || company.name,
    industry: clean(formData.get("industry"), 80),
    country: clean(formData.get("country"), 80),
    city: clean(formData.get("city"), 80),
    website: clean(formData.get("website"), 300),
    careers_page: clean(formData.get("careers"), 300),
    hr_email: clean(formData.get("hrEmail"), 160).toLowerCase() || null,
    recruitment_email: clean(formData.get("recruitmentEmail"), 160).toLowerCase() || null,
    general_email: clean(formData.get("generalEmail"), 160).toLowerCase() || null,
    phone: clean(formData.get("phone"), 40),
    linkedin_url: clean(formData.get("linkedin"), 300),
    description: multiline(formData.get("description"), 4000),
    email_status: clean(formData.get("emailStatus"), 20) || "unavailable",
    contact_status: clean(formData.get("contactStatus"), 20) || "unavailable",
    last_verified_at: new Date().toISOString().slice(0, 19).replace("T", " "),
  });
  audit(actor.id, "edit_company", "company", company.id, company.name);
  redirect(`/admin/companies/${company.id}?notice=saved`);
}

export async function discoveryControlAction(formData: FormData) {
  await requireUser(["admin", "super_admin"]);
  const action = clean(formData.get("action"), 20);
  const current = discoverySettings();
  const next: DiscoverySettings = {
    ...current,
    running: action === "pause" ? false : action === "start" ? true : current.running,
    intervalMinutes: Math.min(1440, Math.max(15, Number(formData.get("interval")) || current.intervalMinutes)),
    countries: checked(formData, "countries"),
    industries: checked(formData, "industries"),
    categories: checked(formData, "categories"),
    defaultQuery: clean(formData.get("query"), 120),
  };
  if (action === "start" || action === "pause" || action === "save") {
    saveDiscoverySettings(next);
  }
  if (action === "run" || action === "start") {
    const result = await runDiscovery({
      trigger: "manual",
      query: next.defaultQuery,
      countries: next.countries,
      industries: next.industries,
      categories: next.categories,
    });
    if (action === "start") saveDiscoverySettings({ ...discoverySettings(), running: true });
    const summary = result.skipped ? "busy" : `${result.created}-${result.duplicates}-${result.found}`;
    redirect(`/admin/discovery?notice=${summary}`);
  }
  redirect("/admin/discovery?notice=saved");
}

export async function sendNoticeAction(formData: FormData) {
  const actor = await requireUser(["admin", "super_admin"]);
  const title = clean(formData.get("title"), 140);
  const body = multiline(formData.get("body"), 2000);
  const audience = clean(formData.get("audience"), 40);
  if (title.length < 3 || body.length < 3) redirect("/admin/notifications?error=invalid");
  let people = audience === "recruiters" ? usersByRole(["recruiter", "employer"]) : audience === "candidates" ? usersByRole(["candidate"]) : usersByRole(["candidate", "recruiter", "employer"]);
  const single = clean(formData.get("email"), 160).toLowerCase();
  if (audience === "one") {
    const user = getUserByEmail(single);
    people = user ? [{ id: user.id, email: user.email }] : [];
  }
  people = people.slice(0, 300);
  for (const person of people) {
    await notify({ userId: person.id, title, body, href: "/candidate/notifications" });
  }
  audit(actor.id, "broadcast", "notification", null, `${audience}:${people.length}`);
  redirect(`/admin/notifications?notice=${people.length}`);
}

export async function saveContentAction(formData: FormData) {
  const actor = await requireUser(["admin", "super_admin"]);
  const keys = ["hero_headline", "hero_subtext", "about_intro", "mission", "vision", "philosophy", "commitment", "contact_email", "contact_phone", "contact_address", "contact_whatsapp", "social_linkedin", "social_facebook", "social_instagram", "social_x", "map_query"];
  for (const key of keys) setSetting(key, multiline(formData.get(key), 4000));
  const services = [0, 1, 2, 3].map((index) => ({
    title: clean(formData.get(`service_title_${index}`), 80),
    text: multiline(formData.get(`service_text_${index}`), 400),
  })).filter((item) => item.title);
  const values = [0, 1, 2, 3].map((index) => ({
    title: clean(formData.get(`value_title_${index}`), 80),
    text: multiline(formData.get(`value_text_${index}`), 400),
  })).filter((item) => item.title);
  setSetting("services", JSON.stringify(services));
  setSetting("values_json", JSON.stringify(values));
  audit(actor.id, "edit_content", "settings", null, "public website");
  redirect("/admin/content?notice=saved");
}

export async function testimonialAction(formData: FormData) {
  await requireUser(["admin", "super_admin"]);
  const intent = clean(formData.get("intent"), 20);
  if (intent === "delete") {
    deleteTestimonial(clean(formData.get("id"), 80));
    redirect("/admin/content?notice=saved");
  }
  const name = clean(formData.get("name"), 80);
  const role = clean(formData.get("role"), 80);
  const quote = multiline(formData.get("quote"), 600);
  if (!name || !role || quote.length < 10) redirect("/admin/content?error=invalid");
  saveTestimonial({ id: clean(formData.get("id"), 80) || undefined, name, role, quote, active: formData.get("active") === "yes" ? 1 : 0 });
  redirect("/admin/content?notice=saved");
}

export async function taxonomyAction(formData: FormData) {
  await requireUser(["admin", "super_admin"]);
  const table = formData.get("table") === "categories" ? "categories" : "industries";
  if (formData.get("intent") === "delete") deleteNamed(table, clean(formData.get("id"), 80));
  else {
    const name = clean(formData.get("name"), 80);
    if (name.length < 2) redirect("/admin/industries?error=invalid");
    try {
      addNamed(table, name);
    } catch {
      redirect("/admin/industries?error=exists");
    }
  }
  redirect("/admin/industries?notice=saved");
}

export async function passwordAction(formData: FormData) {
  const user = await requireUser();
  const next = String(formData.get("password") ?? "");
  const current = String(formData.get("current") ?? "");
  const record = getUserByEmail(user.email);
  if (!record || !verifyPassword(current, record.password_hash) || !validPassword(next)) {
    redirect(`${homeForRole(user.role)}/settings?error=password`);
  }
  updatePassword(user.id, hashPassword(next));
  audit(user.id, "password", "user", user.id, "");
  redirect(`${homeForRole(user.role)}/settings?notice=saved`);
}

export async function deleteOwnAccountAction(formData: FormData) {
  const user = await requireUser(["candidate", "recruiter", "employer"]);
  if (clean(formData.get("confirm")) !== "DELETE") redirect(`${homeForRole(user.role)}/settings?error=confirm`);
  const profile = getCandidate(user.id);
  if (profile?.cv_path) removeCv(profile.cv_path);
  audit(user.id, "delete_account", "user", user.id, user.role);
  await clearSession();
  deleteUser(user.id);
  redirect("/?notice=deleted");
}

export async function contactAction(formData: FormData) {
  if (clean(formData.get("company_site"))) redirect("/contact?notice=sent");
  const name = clean(formData.get("name"), 120);
  const email = clean(formData.get("email"), 160).toLowerCase();
  const phone = clean(formData.get("phone"), 40);
  const subject = clean(formData.get("subject"), 140);
  const message = multiline(formData.get("message"), 4000);
  if (!name || !validEmail(email) || subject.length < 3 || message.length < 10) redirect("/contact?error=invalid");
  addContact({ name, email, phone, subject, message });
  for (const admin of adminIds()) {
    await notify({ userId: admin.id, title: `Contact: ${subject}`, body: `${name} (${email}) wrote: ${message.slice(0, 240)}`, href: "/admin/messages" });
  }
  redirect("/contact?notice=sent");
}

export async function markReadAction() {
  const user = await requireUser();
  markNotificationsRead(user.id);
  redirect(`${homeForRole(user.role)}/notifications?notice=saved`);
}
