import { all, exec, ftsEnabled, one, timestamp, type SqlValue } from "./db";
import { normaliseCompanyName } from "./extract";

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  status: string;
  consent_at: string | null;
  created_at: string;
  updated_at: string;
  display_name?: string;
};

export type JobRow = {
  id: string;
  company_id: string;
  posted_by: string | null;
  title: string;
  description: string;
  requirements: string | null;
  qualifications: string | null;
  experience: string | null;
  location: string | null;
  city: string | null;
  country: string | null;
  salary_text: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
  employment_type: string | null;
  experience_level: string | null;
  industry: string | null;
  category: string | null;
  deadline: string | null;
  source_url: string | null;
  reference_code: string | null;
  origin: string;
  source_name: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  expired_at: string | null;
  company_name?: string;
  company_website?: string | null;
  owner_user_id?: string | null;
};

export type CompanyRow = {
  id: string;
  owner_user_id: string | null;
  contact_name: string | null;
  name: string;
  normalized_name: string;
  industry: string | null;
  country: string | null;
  city: string | null;
  website: string | null;
  careers_page: string | null;
  hr_email: string | null;
  recruitment_email: string | null;
  general_email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  description: string | null;
  source: string;
  contact_status: string;
  email_status: string;
  email_source: string | null;
  discovered_at: string | null;
  last_verified_at: string | null;
  created_at: string;
  vacancy_count?: number;
};

export function getSetting(key: string, fallback = "") {
  return one<{ value: string }>("SELECT value FROM settings WHERE key = ?", [key])?.value ?? fallback;
}

export function setSetting(key: string, value: string) {
  exec("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [key, value]);
}

export function content() {
  const rows = all<{ key: string; value: string }>("SELECT key, value FROM settings");
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const parse = (key: string) => {
    try {
      return JSON.parse(map[key] || "[]") as { title: string; text: string }[];
    } catch {
      return [];
    }
  };
  return {
    email: map.contact_email || "",
    phone: map.contact_phone || "",
    address: map.contact_address || "",
    whatsapp: map.contact_whatsapp || "",
    linkedin: map.social_linkedin || "",
    facebook: map.social_facebook || "",
    instagram: map.social_instagram || "",
    x: map.social_x || "",
    heroHeadline: map.hero_headline || "Connecting Talent With Opportunity.",
    heroSubtext: map.hero_subtext || "",
    about: map.about_intro || "",
    mission: map.mission || "",
    vision: map.vision || "",
    philosophy: map.philosophy || "",
    commitment: map.commitment || "",
    mapQuery: map.map_query || "Sandton, Johannesburg",
    services: parse("services"),
    values: parse("values_json"),
  };
}

export type DiscoverySettings = {
  running: boolean;
  intervalMinutes: number;
  countries: string[];
  industries: string[];
  categories: string[];
  lastScheduledAt: string | null;
  defaultQuery: string;
};

export function discoverySettings(): DiscoverySettings {
  try {
    const parsed = JSON.parse(getSetting("discovery_json", "{}")) as Partial<DiscoverySettings>;
    return {
      running: Boolean(parsed.running),
      intervalMinutes: Number(parsed.intervalMinutes || 360),
      countries: parsed.countries ?? [],
      industries: parsed.industries ?? [],
      categories: parsed.categories ?? [],
      lastScheduledAt: parsed.lastScheduledAt ?? null,
      defaultQuery: parsed.defaultQuery ?? "",
    };
  } catch {
    return { running: false, intervalMinutes: 360, countries: [], industries: [], categories: [], lastScheduledAt: null, defaultQuery: "" };
  }
}

export function saveDiscoverySettings(settings: DiscoverySettings) {
  setSetting("discovery_json", JSON.stringify(settings));
}

export function listIndustries() {
  return all<{ id: string; name: string; slug: string }>("SELECT * FROM industries ORDER BY name");
}

export function listCategories() {
  return all<{ id: string; name: string; slug: string }>("SELECT * FROM categories ORDER BY name");
}

export function addNamed(table: "industries" | "categories", name: string) {
  const id = crypto.randomUUID();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  exec(`INSERT INTO ${table} (id, name, slug) VALUES (?, ?, ?)`, [id, name.trim(), slug]);
}

export function deleteNamed(table: "industries" | "categories", id: string) {
  exec(`DELETE FROM ${table} WHERE id = ?`, [id]);
}

export function listTestimonials(activeOnly = false) {
  return all<{ id: string; name: string; role: string; quote: string; active: number }>(
    `SELECT * FROM testimonials ${activeOnly ? "WHERE active = 1" : ""} ORDER BY rowid`,
  );
}

export function getUserByEmail(email: string) {
  return one<UserRow>("SELECT * FROM users WHERE email = ?", [email.trim().toLowerCase()]);
}

export function getUserById(id: string) {
  return one<UserRow>(
    `SELECT u.*, COALESCE(cp.full_name, c.contact_name, u.email) AS display_name
     FROM users u
     LEFT JOIN candidate_profiles cp ON cp.user_id = u.id
     LEFT JOIN companies c ON c.owner_user_id = u.id
     WHERE u.id = ?`,
    [id],
  );
}

export function createUser(input: { email: string; passwordHash: string; role: string; status: string }) {
  const id = crypto.randomUUID();
  const stamp = timestamp();
  exec(
    "INSERT INTO users (id, email, password_hash, role, status, consent_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [id, input.email.trim().toLowerCase(), input.passwordHash, input.role, input.status, stamp, stamp, stamp],
  );
  return id;
}

export function setUserStatus(id: string, status: string) {
  exec("UPDATE users SET status = ?, updated_at = ? WHERE id = ?", [status, timestamp(), id]);
}

export function updatePassword(id: string, passwordHash: string) {
  exec("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", [passwordHash, timestamp(), id]);
}

export function deleteUser(id: string) {
  exec("DELETE FROM users WHERE id = ?", [id]);
}

export function listUsers(roleGroup: "candidate" | "recruiter") {
  const roles = roleGroup === "candidate" ? ["candidate"] : ["recruiter", "employer"];
  return all<UserRow & { full_name: string | null; phone: string | null; company_name: string | null; career_field: string | null; contact_name: string | null }>(
    `SELECT u.*, cp.full_name, cp.phone, cp.career_field, c.name AS company_name, c.contact_name
     FROM users u
     LEFT JOIN candidate_profiles cp ON cp.user_id = u.id
     LEFT JOIN companies c ON c.owner_user_id = u.id
     WHERE u.role IN (${roles.map(() => "?").join(",")})
     ORDER BY u.created_at DESC`,
    roles,
  );
}

export type CandidateProfile = {
  user_id: string;
  full_name: string;
  first_name: string | null;
  surname: string | null;
  phone: string;
  country: string;
  location: string;
  career_field: string;
  years_experience: number;
  qualification: string;
  cv_path: string | null;
  cv_original_name: string | null;
  cv_updated_at: string | null;
  bio: string | null;
  whatsapp_opt_in: number;
  email_opt_in: number;
};

export function getCandidate(userId: string) {
  return one<CandidateProfile>("SELECT * FROM candidate_profiles WHERE user_id = ?", [userId]);
}

export function saveCandidate(profile: CandidateProfile) {
  exec(
    `INSERT INTO candidate_profiles
      (user_id, full_name, first_name, surname, phone, country, location, career_field, years_experience, qualification, cv_path, cv_original_name, cv_updated_at, bio, whatsapp_opt_in, email_opt_in)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
      full_name = excluded.full_name,
      first_name = excluded.first_name,
      surname = excluded.surname,
      phone = excluded.phone,
      country = excluded.country,
      location = excluded.location,
      career_field = excluded.career_field,
      years_experience = excluded.years_experience,
      qualification = excluded.qualification,
      cv_path = excluded.cv_path,
      cv_original_name = excluded.cv_original_name,
      cv_updated_at = excluded.cv_updated_at,
      bio = excluded.bio,
      whatsapp_opt_in = excluded.whatsapp_opt_in,
      email_opt_in = excluded.email_opt_in`,
    [
      profile.user_id,
      profile.full_name,
      profile.first_name,
      profile.surname,
      profile.phone,
      profile.country,
      profile.location,
      profile.career_field,
      profile.years_experience,
      profile.qualification,
      profile.cv_path,
      profile.cv_original_name,
      profile.cv_updated_at,
      profile.bio,
      profile.whatsapp_opt_in,
      profile.email_opt_in,
    ],
  );
}

export function getCompanyByOwner(userId: string) {
  return one<CompanyRow>("SELECT * FROM companies WHERE owner_user_id = ?", [userId]);
}

export function getCompany(id: string) {
  return one<CompanyRow>("SELECT * FROM companies WHERE id = ?", [id]);
}

export function findCompanyByName(name: string) {
  return one<CompanyRow>("SELECT * FROM companies WHERE normalized_name = ?", [normaliseCompanyName(name)]);
}

export function createCompany(input: Partial<CompanyRow> & { name: string; source: string }) {
  const id = crypto.randomUUID();
  const stamp = timestamp();
  exec(
    `INSERT INTO companies
      (id, owner_user_id, contact_name, name, normalized_name, industry, country, city, website, careers_page, hr_email, recruitment_email, general_email, phone, linkedin_url, description, source, contact_status, email_status, email_source, discovered_at, last_verified_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.owner_user_id ?? null,
      input.contact_name ?? null,
      input.name.trim(),
      normaliseCompanyName(input.name),
      input.industry ?? null,
      input.country ?? null,
      input.city ?? null,
      input.website ?? null,
      input.careers_page ?? null,
      input.hr_email ?? null,
      input.recruitment_email ?? null,
      input.general_email ?? null,
      input.phone ?? null,
      input.linkedin_url ?? null,
      input.description ?? null,
      input.source,
      input.contact_status ?? "unavailable",
      input.email_status ?? "unavailable",
      input.email_source ?? null,
      input.discovered_at ?? null,
      input.last_verified_at ?? null,
      stamp,
    ],
  );
  return id;
}

export function updateCompany(id: string, input: Partial<CompanyRow>) {
  const current = getCompany(id);
  if (!current) return;
  const name = input.name ?? current.name;
  exec(
    `UPDATE companies SET
      contact_name = ?, name = ?, normalized_name = ?, industry = ?, country = ?, city = ?, website = ?, careers_page = ?,
      hr_email = ?, recruitment_email = ?, general_email = ?, phone = ?, linkedin_url = ?, description = ?,
      contact_status = ?, email_status = ?, email_source = ?, last_verified_at = ?
     WHERE id = ?`,
    [
      input.contact_name ?? current.contact_name,
      name,
      normaliseCompanyName(name),
      input.industry ?? current.industry,
      input.country ?? current.country,
      input.city ?? current.city,
      input.website ?? current.website,
      input.careers_page ?? current.careers_page,
      input.hr_email ?? current.hr_email,
      input.recruitment_email ?? current.recruitment_email,
      input.general_email ?? current.general_email,
      input.phone ?? current.phone,
      input.linkedin_url ?? current.linkedin_url,
      input.description ?? current.description,
      input.contact_status ?? current.contact_status,
      input.email_status ?? current.email_status,
      input.email_source ?? current.email_source,
      input.last_verified_at ?? current.last_verified_at,
      id,
    ],
  );
}

export function listCompanies(filters: { q?: string; country?: string; contact?: string; source?: string; limit?: number; offset?: number }) {
  const where: string[] = [];
  const params: SqlValue[] = [];
  if (filters.q) {
    where.push("(name LIKE ? OR industry LIKE ? OR city LIKE ? OR recruitment_email LIKE ? OR hr_email LIKE ? OR general_email LIKE ?)");
    const like = `%${filters.q}%`;
    params.push(like, like, like, like, like, like);
  }
  if (filters.country) {
    where.push("country = ?");
    params.push(filters.country);
  }
  if (filters.contact === "with_email") where.push("email_status != 'unavailable'");
  if (filters.contact === "without") where.push("email_status = 'unavailable' AND (phone IS NULL OR phone = '')");
  if (filters.source) {
    where.push("source = ?");
    params.push(filters.source);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = one<{ count: number }>(`SELECT COUNT(*) AS count FROM companies ${clause}`, params)?.count ?? 0;
  const rows = all<CompanyRow>(
    `SELECT c.*, (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id AND j.status = 'published') AS vacancy_count
     FROM companies c ${clause} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
    [...params, filters.limit ?? 25, filters.offset ?? 0],
  );
  return { rows, total };
}

export function indexJob(jobId: string) {
  if (!ftsEnabled()) return;
  const row = one<JobRow & { company_name: string }>(
    `SELECT j.*, c.name AS company_name FROM jobs j JOIN companies c ON c.id = j.company_id WHERE j.id = ?`,
    [jobId],
  );
  if (!row) {
    exec("DELETE FROM jobs_fts WHERE job_id = ?", [jobId]);
    return;
  }
  exec("DELETE FROM jobs_fts WHERE job_id = ?", [jobId]);
  exec(
    "INSERT INTO jobs_fts (job_id, title, company, description, location, industry, category) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [row.id, row.title, row.company_name, row.description, `${row.location ?? ""} ${row.city ?? ""} ${row.country ?? ""}`, row.industry, row.category],
  );
}

export function createJob(input: Omit<JobRow, "id" | "created_at" | "updated_at" | "published_at" | "expired_at" | "rejection_reason"> & { status?: string }) {
  const id = crypto.randomUUID();
  const stamp = timestamp();
  exec(
    `INSERT INTO jobs
      (id, company_id, posted_by, title, description, requirements, qualifications, experience, location, city, country,
       salary_text, salary_min, salary_max, currency, employment_type, experience_level, industry, category, deadline,
       source_url, reference_code, origin, source_name, status, created_at, updated_at, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.company_id,
      input.posted_by,
      input.title,
      input.description,
      input.requirements,
      input.qualifications,
      input.experience,
      input.location,
      input.city,
      input.country,
      input.salary_text,
      input.salary_min,
      input.salary_max,
      input.currency,
      input.employment_type,
      input.experience_level,
      input.industry,
      input.category,
      input.deadline,
      input.source_url,
      input.reference_code,
      input.origin,
      input.source_name,
      input.status ?? "pending",
      stamp,
      stamp,
      input.status === "published" ? stamp : null,
    ],
  );
  indexJob(id);
  return id;
}

export function updateJob(id: string, fields: Partial<JobRow>) {
  const current = getJob(id);
  if (!current) return;
  const status = fields.status ?? current.status;
  exec(
    `UPDATE jobs SET
      title = ?, description = ?, requirements = ?, qualifications = ?, experience = ?, location = ?, city = ?, country = ?,
      salary_text = ?, salary_min = ?, salary_max = ?, currency = ?, employment_type = ?, experience_level = ?, industry = ?,
      category = ?, deadline = ?, source_url = ?, reference_code = ?, status = ?, rejection_reason = ?, updated_at = ?,
      published_at = ?, expired_at = ?
     WHERE id = ?`,
    [
      fields.title ?? current.title,
      fields.description ?? current.description,
      fields.requirements ?? current.requirements,
      fields.qualifications ?? current.qualifications,
      fields.experience ?? current.experience,
      fields.location ?? current.location,
      fields.city ?? current.city,
      fields.country ?? current.country,
      fields.salary_text ?? current.salary_text,
      fields.salary_min ?? current.salary_min,
      fields.salary_max ?? current.salary_max,
      fields.currency ?? current.currency,
      fields.employment_type ?? current.employment_type,
      fields.experience_level ?? current.experience_level,
      fields.industry ?? current.industry,
      fields.category ?? current.category,
      fields.deadline ?? current.deadline,
      fields.source_url ?? current.source_url,
      fields.reference_code ?? current.reference_code,
      status,
      fields.rejection_reason ?? current.rejection_reason,
      timestamp(),
      status === "published" ? current.published_at ?? timestamp() : current.published_at,
      status === "expired" ? current.expired_at ?? timestamp() : current.expired_at,
      id,
    ],
  );
  indexJob(id);
}

export function getJob(id: string) {
  return one<JobRow>(
    `SELECT j.*, c.name AS company_name, c.website AS company_website, c.owner_user_id
     FROM jobs j JOIN companies c ON c.id = j.company_id WHERE j.id = ?`,
    [id],
  );
}

export type JobFilters = {
  q?: string;
  company?: string;
  country?: string;
  city?: string;
  industry?: string;
  category?: string;
  salary?: string;
  employment?: string;
  level?: string;
  status?: string;
  origin?: string;
  page?: number;
  pageSize?: number;
};

function salaryClause(band: string, where: string[], params: SqlValue[]) {
  if (!band) return;
  if (band.endsWith("+")) {
    const min = Number(band.replace("+", ""));
    where.push("(salary_max >= ? OR salary_min >= ?)");
    params.push(min, min);
    return;
  }
  const [min, max] = band.split("-").map(Number);
  where.push("((salary_min IS NOT NULL AND salary_min <= ?) AND (salary_max IS NULL OR salary_max >= ?))");
  params.push(max, min);
}

export function searchJobs(filters: JobFilters, publicOnly: boolean) {
  const where: string[] = [];
  const params: SqlValue[] = [];
  if (publicOnly) where.push("j.status = 'published'");
  else if (filters.status) {
    where.push("j.status = ?");
    params.push(filters.status);
  }
  if (filters.origin) {
    where.push("j.origin = ?");
    params.push(filters.origin);
  }
  if (filters.q) {
    if (ftsEnabled()) {
      const terms = filters.q.split(/\s+/).map((term) => term.replace(/["'*]/g, "")).filter((term) => term.length > 1);
      if (terms.length) {
        where.push("j.id IN (SELECT job_id FROM jobs_fts WHERE jobs_fts MATCH ?)");
        params.push(terms.map((term) => `"${term}"*`).join(" AND "));
      }
    } else {
      where.push("(j.title LIKE ? OR j.description LIKE ? OR c.name LIKE ?)");
      const like = `%${filters.q}%`;
      params.push(like, like, like);
    }
  }
  if (filters.company) {
    where.push("c.name LIKE ?");
    params.push(`%${filters.company}%`);
  }
  if (filters.country) {
    where.push("j.country = ?");
    params.push(filters.country);
  }
  if (filters.city) {
    where.push("(j.city LIKE ? OR j.location LIKE ?)");
    params.push(`%${filters.city}%`, `%${filters.city}%`);
  }
  if (filters.industry) {
    where.push("j.industry = ?");
    params.push(filters.industry);
  }
  if (filters.category) {
    where.push("j.category = ?");
    params.push(filters.category);
  }
  if (filters.employment) {
    where.push("j.employment_type = ?");
    params.push(filters.employment);
  }
  if (filters.level) {
    where.push("j.experience_level = ?");
    params.push(filters.level);
  }
  salaryClause(filters.salary || "", where, params);
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const pageSize = filters.pageSize ?? 12;
  const page = Math.max(1, filters.page ?? 1);
  const total = one<{ count: number }>(`SELECT COUNT(*) AS count FROM jobs j JOIN companies c ON c.id = j.company_id ${clause}`, params)?.count ?? 0;
  const rows = all<JobRow>(
    `SELECT j.*, c.name AS company_name, c.website AS company_website, c.owner_user_id
     FROM jobs j JOIN companies c ON c.id = j.company_id
     ${clause}
     ORDER BY datetime(COALESCE(j.published_at, j.created_at)) DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize],
  );
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export function duplicateJob(input: { sourceUrl?: string | null; reference?: string | null; companyName: string; title: string; country: string }) {
  if (input.sourceUrl && input.sourceUrl.length > 8) {
    const byUrl = one<{ id: string }>("SELECT id FROM jobs WHERE source_url = ?", [input.sourceUrl]);
    if (byUrl) return byUrl.id;
  }
  const company = findCompanyByName(input.companyName);
  if (company && input.reference) {
    const byRef = one<{ id: string }>("SELECT id FROM jobs WHERE company_id = ? AND reference_code = ?", [company.id, input.reference]);
    if (byRef) return byRef.id;
  }
  if (company) {
    const byTitle = one<{ id: string }>(
      "SELECT id FROM jobs WHERE company_id = ? AND lower(title) = lower(?) AND COALESCE(country, '') = ?",
      [company.id, input.title, input.country || ""],
    );
    if (byTitle) return byTitle.id;
  }
  return null;
}

export function deleteJob(id: string) {
  const apps = one<{ count: number }>("SELECT COUNT(*) AS count FROM applications WHERE job_id = ?", [id]);
  if ((apps?.count ?? 0) > 0) return false;
  exec("DELETE FROM saved_jobs WHERE job_id = ?", [id]);
  exec("DELETE FROM jobs WHERE id = ?", [id]);
  if (ftsEnabled()) exec("DELETE FROM jobs_fts WHERE job_id = ?", [id]);
  return true;
}

export function isSaved(userId: string, jobId: string) {
  return Boolean(one("SELECT 1 AS ok FROM saved_jobs WHERE user_id = ? AND job_id = ?", [userId, jobId]));
}

export function saveJobForUser(userId: string, jobId: string) {
  exec("INSERT OR IGNORE INTO saved_jobs (user_id, job_id, created_at) VALUES (?, ?, ?)", [userId, jobId, timestamp()]);
}

export function unsaveJob(userId: string, jobId: string) {
  exec("DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?", [userId, jobId]);
}

export function listSaved(userId: string) {
  return all<JobRow>(
    `SELECT j.*, c.name AS company_name FROM saved_jobs s
     JOIN jobs j ON j.id = s.job_id JOIN companies c ON c.id = j.company_id
     WHERE s.user_id = ? ORDER BY s.created_at DESC`,
    [userId],
  );
}

export function recommendations(userId: string) {
  const profile = getCandidate(userId);
  if (!profile) return [];
  return all<JobRow>(
    `SELECT j.*, c.name AS company_name FROM jobs j
     JOIN companies c ON c.id = j.company_id
     WHERE j.status = 'published'
       AND j.id NOT IN (SELECT job_id FROM applications WHERE candidate_user_id = ?)
       AND (j.industry = ? OR j.title LIKE ? OR j.category LIKE ?)
     ORDER BY datetime(j.published_at) DESC LIMIT 8`,
    [userId, profile.career_field, `%${profile.career_field.split(" ")[0]}%`, `%${profile.career_field.split(" ")[0]}%`],
  );
}

export function createApplication(input: { jobId: string; userId: string; cvPath: string | null; cvName: string | null; note: string }) {
  const id = crypto.randomUUID();
  const stamp = timestamp();
  exec(
    `INSERT INTO applications (id, job_id, candidate_user_id, cv_path, cv_original_name, note, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [id, input.jobId, input.userId, input.cvPath, input.cvName, input.note, stamp, stamp],
  );
  exec(
    "INSERT INTO application_events (id, application_id, actor_user_id, status, note, created_at) VALUES (?, ?, ?, 'pending', 'Application submitted', ?)",
    [crypto.randomUUID(), id, input.userId, stamp],
  );
  return id;
}

export function getApplication(id: string) {
  return one<
    {
      id: string;
      job_id: string;
      candidate_user_id: string;
      cv_path: string | null;
      cv_original_name: string | null;
      note: string | null;
      status: string;
      created_at: string;
      updated_at: string;
      title: string;
      company_name: string;
      owner_user_id: string | null;
      full_name: string;
      email: string;
      phone: string;
      posted_by: string | null;
    }
  >(
    `SELECT a.*, j.title, j.posted_by, c.name AS company_name, c.owner_user_id, cp.full_name, u.email, cp.phone
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     JOIN companies c ON c.id = j.company_id
     JOIN users u ON u.id = a.candidate_user_id
     JOIN candidate_profiles cp ON cp.user_id = a.candidate_user_id
     WHERE a.id = ?`,
    [id],
  );
}

export function listCandidateApplications(userId: string) {
  return all<{ id: string; status: string; created_at: string; title: string; company_name: string; job_id: string }>(
    `SELECT a.id, a.status, a.created_at, j.title, j.id AS job_id, c.name AS company_name
     FROM applications a JOIN jobs j ON j.id = a.job_id JOIN companies c ON c.id = j.company_id
     WHERE a.candidate_user_id = ? ORDER BY a.created_at DESC`,
    [userId],
  );
}

export function listJobApplications(jobId: string) {
  return all<{ id: string; status: string; created_at: string; full_name: string; email: string; qualification: string; years_experience: number }>(
    `SELECT a.id, a.status, a.created_at, cp.full_name, u.email, cp.qualification, cp.years_experience
     FROM applications a JOIN users u ON u.id = a.candidate_user_id JOIN candidate_profiles cp ON cp.user_id = u.id
     WHERE a.job_id = ? ORDER BY a.created_at DESC`,
    [jobId],
  );
}

export function listRecruiterApplications(ownerId: string) {
  return all<{ id: string; status: string; created_at: string; title: string; full_name: string; job_id: string }>(
    `SELECT a.id, a.status, a.created_at, j.title, j.id AS job_id, cp.full_name
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     JOIN companies c ON c.id = j.company_id
     JOIN candidate_profiles cp ON cp.user_id = a.candidate_user_id
     WHERE c.owner_user_id = ?
     ORDER BY a.created_at DESC`,
    [ownerId],
  );
}

export function listAllApplications(limit = 100) {
  return all<{ id: string; status: string; created_at: string; title: string; company_name: string; full_name: string }>(
    `SELECT a.id, a.status, a.created_at, j.title, c.name AS company_name, cp.full_name
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     JOIN companies c ON c.id = j.company_id
     JOIN candidate_profiles cp ON cp.user_id = a.candidate_user_id
     ORDER BY a.created_at DESC LIMIT ?`,
    [limit],
  );
}

export function setApplicationStatus(id: string, status: string, actorId: string, note: string) {
  const stamp = timestamp();
  exec("UPDATE applications SET status = ?, updated_at = ? WHERE id = ?", [status, stamp, id]);
  exec(
    "INSERT INTO application_events (id, application_id, actor_user_id, status, note, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    [crypto.randomUUID(), id, actorId, status, note || null, stamp],
  );
}

export function applicationEvents(id: string) {
  return all<{ id: string; status: string; note: string | null; created_at: string }>(
    "SELECT id, status, note, created_at FROM application_events WHERE application_id = ? ORDER BY created_at",
    [id],
  );
}

export function addMessage(applicationId: string, senderId: string, body: string) {
  exec("INSERT INTO messages (id, application_id, sender_user_id, body, created_at) VALUES (?, ?, ?, ?, ?)", [
    crypto.randomUUID(),
    applicationId,
    senderId,
    body.trim(),
    timestamp(),
  ]);
}

export function listMessages(applicationId: string) {
  return all<{ id: string; body: string; created_at: string; sender_user_id: string; email: string; display_name: string }>(
    `SELECT m.*, u.email, COALESCE(cp.full_name, c.contact_name, u.email) AS display_name
     FROM messages m
     JOIN users u ON u.id = m.sender_user_id
     LEFT JOIN candidate_profiles cp ON cp.user_id = u.id
     LEFT JOIN companies c ON c.owner_user_id = u.id
     WHERE m.application_id = ? ORDER BY m.created_at`,
    [applicationId],
  );
}

export function createInterview(input: { applicationId: string; scheduledAt: string; mode: string; place: string; message: string; createdBy: string }) {
  exec(
    "INSERT INTO interviews (id, application_id, scheduled_at, mode, place, message, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [crypto.randomUUID(), input.applicationId, input.scheduledAt, input.mode, input.place, input.message, input.createdBy, timestamp()],
  );
}

export function listInterviewsForCandidate(userId: string) {
  return all<{ id: string; scheduled_at: string; mode: string; place: string | null; message: string | null; title: string; company_name: string }>(
    `SELECT i.*, j.title, c.name AS company_name
     FROM interviews i
     JOIN applications a ON a.id = i.application_id
     JOIN jobs j ON j.id = a.job_id
     JOIN companies c ON c.id = j.company_id
     WHERE a.candidate_user_id = ? ORDER BY i.scheduled_at`,
    [userId],
  );
}

export function listInterviewsForApplication(applicationId: string) {
  return all<{ id: string; scheduled_at: string; mode: string; place: string | null; message: string | null }>(
    "SELECT * FROM interviews WHERE application_id = ? ORDER BY scheduled_at",
    [applicationId],
  );
}

export function notifyUser(input: { userId: string; title: string; body: string; href?: string; emailStatus?: string; whatsappStatus?: string }) {
  exec(
    "INSERT INTO notifications (id, user_id, title, body, href, email_status, whatsapp_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [crypto.randomUUID(), input.userId, input.title, input.body, input.href ?? null, input.emailStatus ?? "not_sent", input.whatsappStatus ?? "not_sent", timestamp()],
  );
}

export function listNotifications(userId: string) {
  return all<{ id: string; title: string; body: string; href: string | null; read_at: string | null; created_at: string; email_status: string | null }>(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100",
    [userId],
  );
}

export function unreadCount(userId: string) {
  return one<{ count: number }>("SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read_at IS NULL", [userId])?.count ?? 0;
}

export function markNotificationsRead(userId: string) {
  exec("UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL", [timestamp(), userId]);
}

export function adminIds() {
  return all<{ id: string; email: string }>("SELECT id, email FROM users WHERE role IN ('super_admin','admin') AND status = 'active'");
}

export function usersByRole(roles: string[]) {
  return all<{ id: string; email: string }>(
    `SELECT id, email FROM users WHERE status = 'active' AND role IN (${roles.map(() => "?").join(",")})`,
    roles,
  );
}

export function candidatesForField(field: string, category: string, jobId: string) {
  const career = field.trim();
  const group = category.trim();
  if (!career && !group) return [];
  return all<{ id: string; email: string; whatsapp_opt_in: number; phone: string; email_opt_in: number }>(
    `SELECT u.id, u.email, cp.whatsapp_opt_in, cp.phone, cp.email_opt_in
     FROM users u JOIN candidate_profiles cp ON cp.user_id = u.id
     WHERE u.role = 'candidate' AND u.status IN ('active', 'pending')
       AND (lower(cp.career_field) = lower(?) OR lower(cp.career_field) = lower(?))
       AND NOT EXISTS (
         SELECT 1 FROM applications a WHERE a.job_id = ? AND a.candidate_user_id = u.id
       )
     LIMIT 200`,
    [career, group, jobId],
  );
}

export function audit(actorId: string | null, action: string, entity: string, entityId: string | null, detail: string) {
  exec(
    "INSERT INTO audit_logs (id, actor_user_id, action, entity, entity_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [crypto.randomUUID(), actorId, action, entity, entityId, detail.slice(0, 500), timestamp()],
  );
}

export function listAudit() {
  return all<{ id: string; action: string; entity: string | null; entity_id: string | null; detail: string | null; created_at: string; email: string | null }>(
    `SELECT a.*, u.email FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id ORDER BY a.created_at DESC LIMIT 200`,
  );
}

export function addContact(input: { name: string; email: string; phone: string; subject: string; message: string }) {
  exec(
    "INSERT INTO contact_messages (id, name, email, phone, subject, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [crypto.randomUUID(), input.name, input.email, input.phone, input.subject, input.message, timestamp()],
  );
}

export function listContacts() {
  return all<{ id: string; name: string; email: string; phone: string | null; subject: string; message: string; created_at: string }>(
    "SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 100",
  );
}

export function saveTestimonial(input: { id?: string; name: string; role: string; quote: string; active: number }) {
  if (input.id) {
    exec("UPDATE testimonials SET name = ?, role = ?, quote = ?, active = ? WHERE id = ?", [input.name, input.role, input.quote, input.active, input.id]);
    return;
  }
  exec("INSERT INTO testimonials (id, name, role, quote, active) VALUES (?, ?, ?, ?, ?)", [
    crypto.randomUUID(),
    input.name,
    input.role,
    input.quote,
    input.active,
  ]);
}

export function deleteTestimonial(id: string) {
  exec("DELETE FROM testimonials WHERE id = ?", [id]);
}

export function startRun(trigger: string, query: string, filters: string) {
  const id = crypto.randomUUID();
  exec(
    "INSERT INTO discovery_runs (id, trigger, status, query, filters, started_at) VALUES (?, ?, 'running', ?, ?, ?)",
    [id, trigger, query, filters, timestamp()],
  );
  return id;
}

export function finishRun(id: string, patch: { status: string; found: number; created: number; duplicates: number; enriched: number; error?: string }) {
  exec(
    `UPDATE discovery_runs SET status = ?, finished_at = ?, found_count = ?, new_count = ?, duplicate_count = ?, enriched_count = ?, error = ? WHERE id = ?`,
    [patch.status, timestamp(), patch.found, patch.created, patch.duplicates, patch.enriched, patch.error ?? null, id],
  );
}

export function listRuns() {
  return all<{
    id: string;
    trigger: string;
    status: string;
    query: string | null;
    started_at: string;
    finished_at: string | null;
    found_count: number;
    new_count: number;
    duplicate_count: number;
    enriched_count: number;
    error: string | null;
  }>("SELECT * FROM discovery_runs ORDER BY started_at DESC LIMIT 20");
}

export function markStaleRuns() {
  exec(
    `UPDATE discovery_runs SET status = 'failed', error = 'The run did not finish.', finished_at = ?
     WHERE status = 'running' AND started_at < datetime('now', '-15 minutes')`,
    [timestamp()],
  );
}

export function discoveryStats() {
  return {
    companies: one<{ count: number }>("SELECT COUNT(*) AS count FROM companies WHERE source = 'discovered'")?.count ?? 0,
    vacancies: one<{ count: number }>("SELECT COUNT(*) AS count FROM jobs WHERE origin = 'discovery'")?.count ?? 0,
    today: one<{ count: number }>("SELECT COUNT(*) AS count FROM jobs WHERE origin = 'discovery' AND date(created_at) = date('now')")?.count ?? 0,
    withEmail: one<{ count: number }>("SELECT COUNT(*) AS count FROM companies WHERE source = 'discovered' AND email_status != 'unavailable'")?.count ?? 0,
    withoutContact:
      one<{ count: number }>(
        "SELECT COUNT(*) AS count FROM companies WHERE source = 'discovered' AND email_status = 'unavailable' AND (phone IS NULL OR phone = '')",
      )?.count ?? 0,
    pending: one<{ count: number }>("SELECT COUNT(*) AS count FROM jobs WHERE status = 'pending'")?.count ?? 0,
    approved: one<{ count: number }>("SELECT COUNT(*) AS count FROM jobs WHERE status IN ('approved','published','unpublished')")?.count ?? 0,
    rejected: one<{ count: number }>("SELECT COUNT(*) AS count FROM jobs WHERE status = 'rejected'")?.count ?? 0,
    expired: one<{ count: number }>("SELECT COUNT(*) AS count FROM jobs WHERE status = 'expired'")?.count ?? 0,
  };
}

export function vacancyActivity() {
  const count = (clause: string) => one<{ count: number }>(`SELECT COUNT(*) AS count FROM jobs ${clause}`)?.count ?? 0;
  return {
    today: count("WHERE date(created_at) = date('now')"),
    week: count("WHERE datetime(created_at) >= datetime('now', '-6 days')"),
    month: count("WHERE datetime(created_at) >= datetime('now', 'start of month')"),
    all: count(""),
  };
}

export function recentVacancies(limit = 8) {
  return all<{ id: string; title: string; status: string; source_name: string | null; created_at: string; company_name: string }>(
    `SELECT j.id, j.title, j.status, j.source_name, j.created_at, c.name AS company_name
     FROM jobs j JOIN companies c ON c.id = j.company_id
     ORDER BY datetime(j.created_at) DESC LIMIT ?`,
    [limit],
  );
}

export function platformStats() {
  return {
    candidates: one<{ count: number }>("SELECT COUNT(*) AS count FROM users WHERE role = 'candidate'")?.count ?? 0,
    recruiters: one<{ count: number }>("SELECT COUNT(*) AS count FROM users WHERE role IN ('recruiter','employer')")?.count ?? 0,
    companies: one<{ count: number }>("SELECT COUNT(*) AS count FROM companies")?.count ?? 0,
    discovered: one<{ count: number }>("SELECT COUNT(*) AS count FROM jobs WHERE origin = 'discovery'")?.count ?? 0,
    published: one<{ count: number }>("SELECT COUNT(*) AS count FROM jobs WHERE status = 'published'")?.count ?? 0,
    applications: one<{ count: number }>("SELECT COUNT(*) AS count FROM applications")?.count ?? 0,
    pendingJobs: one<{ count: number }>("SELECT COUNT(*) AS count FROM jobs WHERE status = 'pending'")?.count ?? 0,
    pendingUsers: one<{ count: number }>("SELECT COUNT(*) AS count FROM users WHERE status = 'pending'")?.count ?? 0,
    activeVacancies: one<{ count: number }>("SELECT COUNT(*) AS count FROM jobs WHERE status = 'published'")?.count ?? 0,
  };
}

export function jobsByIndustry() {
  return all<{ industry: string; count: number }>(
    `SELECT COALESCE(industry, 'Unspecified') AS industry, COUNT(*) AS count
     FROM jobs WHERE status = 'published' GROUP BY industry ORDER BY count DESC LIMIT 8`,
  );
}

export function applicationsByStatus() {
  return all<{ status: string; count: number }>("SELECT status, COUNT(*) AS count FROM applications GROUP BY status");
}

export function recentCompanies() {
  return all<CompanyRow>("SELECT * FROM companies WHERE source = 'discovered' ORDER BY created_at DESC LIMIT 6");
}

export function featuredEmployers() {
  return all<CompanyRow>(
    `SELECT c.*, COUNT(j.id) AS vacancy_count FROM companies c
     JOIN jobs j ON j.company_id = c.id AND j.status = 'published'
     GROUP BY c.id ORDER BY vacancy_count DESC LIMIT 6`,
  );
}

export function recruiterJobs(ownerId: string) {
  return all<JobRow & { application_count: number }>(
    `SELECT j.*, c.name AS company_name,
      (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS application_count
     FROM jobs j JOIN companies c ON c.id = j.company_id
     WHERE c.owner_user_id = ? ORDER BY j.created_at DESC`,
    [ownerId],
  );
}

export function applicationCount(jobId: string) {
  return one<{ count: number }>("SELECT COUNT(*) AS count FROM applications WHERE job_id = ?", [jobId])?.count ?? 0;
}

export function expireDueJobs() {
  const rows = all<{ id: string; title: string; posted_by: string | null; deadline: string }>(
    `SELECT id, title, posted_by, deadline FROM jobs
     WHERE status = 'published' AND deadline IS NOT NULL AND length(deadline) >= 10 AND date(deadline) < date('now')`,
  );
  const stamp = timestamp();
  for (const row of rows) {
    exec("UPDATE jobs SET status = 'expired', expired_at = ?, updated_at = ? WHERE id = ?", [stamp, stamp, row.id]);
  }
  const soon = all<{ id: string; title: string; posted_by: string | null; deadline: string }>(
    `SELECT id, title, posted_by, deadline FROM jobs
     WHERE status = 'published' AND deadline IS NOT NULL AND expiry_notice_on IS NULL
       AND date(deadline) >= date('now') AND date(deadline) <= date('now', '+3 days')`,
  );
  for (const row of soon) {
    exec("UPDATE jobs SET expiry_notice_on = ? WHERE id = ?", [stamp, row.id]);
  }
  return { expired: rows, expiring: soon };
}

export function exportCompanies() {
  return all<CompanyRow>("SELECT * FROM companies ORDER BY name");
}

export function exportReport() {
  return {
    users: all<{ role: string; status: string; count: number }>("SELECT role, status, COUNT(*) AS count FROM users GROUP BY role, status"),
    jobs: all<{ status: string; origin: string; count: number }>("SELECT status, origin, COUNT(*) AS count FROM jobs GROUP BY status, origin"),
    applications: applicationsByStatus(),
  };
}

export function candidateExport(userId: string) {
  return {
    user: getUserById(userId),
    profile: getCandidate(userId),
    applications: listCandidateApplications(userId),
    saved: listSaved(userId).map((job) => ({ id: job.id, title: job.title, company: job.company_name })),
  };
}
