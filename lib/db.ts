import fs from "fs";
import path from "path";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { DatabaseSync } from "node:sqlite";
import { CATEGORY_SEEDS, INDUSTRY_SEEDS } from "./constants";
import { slugify } from "./extract";

const globalForDb = globalThis as unknown as { __tcDb?: DatabaseSync; __tcFts?: boolean };

export function dataDir() {
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(dir, "cvs"), { recursive: true });
  return dir;
}

function now() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

export function timestamp() {
  return now();
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

function seed(db: DatabaseSync) {
  const insertSetting = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
  const defaults: Record<string, string> = {
    contact_email: "hello@talentcrafters.com",
    contact_phone: "+27 10 500 2200",
    contact_address: "Sandton, Johannesburg, South Africa",
    contact_whatsapp: "+27105002200",
    social_linkedin: "https://www.linkedin.com",
    social_facebook: "https://www.facebook.com",
    social_instagram: "https://www.instagram.com",
    social_x: "https://x.com",
    hero_headline: "Connecting Talent With Opportunity.",
    hero_subtext:
      "Talent Crafters Recruitment introduces employers to qualified people across local and international markets. Every vacancy is reviewed by our team before it is published.",
    about_intro:
      "Talent Crafters Recruitment is a professional recruitment house. We help candidates present their experience clearly, and we help employers reach people whose skills match the work on offer.",
    mission:
      "To make trustworthy recruitment practical: verified vacancies, respectful communication, and a clear record of every application.",
    vision:
      "A recruitment practice known for careful judgement, fair process, and opportunities that candidates can trust.",
    philosophy:
      "We publish a role only after a person has checked the source, the employer, and the closing date. Discovery tools collect public advertisements. People decide what candidates can see.",
    commitment:
      "Candidates can track every application. Employers and recruiters see only the applications for roles they manage. Administrators approve accounts, vacancies, and discovered listings before they go live.",
    services: JSON.stringify([
      { title: "Permanent recruitment", text: "Search, shortlist, and interview support for full-time appointments." },
      { title: "Contract and specialist search", text: "Time-bound and scarce-skill appointments with a documented process." },
      { title: "Candidate representation", text: "Profile, CV, and application tracking for people seeking their next role." },
      { title: "Discovered vacancies", text: "Public advertisements collected from permitted sources and held for administrator approval." },
    ]),
    values_json: JSON.stringify([
      { title: "Care", text: "We treat applications, CVs, and contact details as private records." },
      { title: "Accuracy", text: "We do not invent salaries, emails, or requirements that were not advertised." },
      { title: "Accountability", text: "Approvals, status changes, and exports are written to the audit log." },
      { title: "Opportunity", text: "Local and international roles sit in one searchable catalogue once they are approved." },
    ]),
    map_query: "Sandton, Johannesburg",
    discovery_json: JSON.stringify({
      running: false,
      intervalMinutes: 360,
      countries: ["South Africa", "Lesotho", "Botswana", "Eswatini", "Zimbabwe"],
      industries: [],
      categories: [],
      lastScheduledAt: null,
      defaultQuery: "",
    }),
  };
  for (const [key, value] of Object.entries(defaults)) insertSetting.run(key, value);

  const industryCount = db.prepare("SELECT COUNT(*) AS count FROM industries").get() as { count: number };
  if (industryCount.count === 0) {
    const insert = db.prepare("INSERT INTO industries (id, name, slug) VALUES (?, ?, ?)");
    for (const name of INDUSTRY_SEEDS) insert.run(crypto.randomUUID(), name, slugify(name));
  }
  const categoryCount = db.prepare("SELECT COUNT(*) AS count FROM categories").get() as { count: number };
  if (categoryCount.count === 0) {
    const insert = db.prepare("INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)");
    for (const name of CATEGORY_SEEDS) insert.run(crypto.randomUUID(), name, slugify(name));
  }
  const quotes = db.prepare("SELECT COUNT(*) AS count FROM testimonials").get() as { count: number };
  if (quotes.count === 0) {
    const insert = db.prepare("INSERT INTO testimonials (id, name, role, quote, active) VALUES (?, ?, ?, ?, 1)");
    insert.run(
      crypto.randomUUID(),
      "Employer partner",
      "Professional services",
      "The approval queue kept our advertised roles separate from listings that still needed to be checked.",
    );
    insert.run(
      crypto.randomUUID(),
      "Registered candidate",
      "Finance professional",
      "I could follow each application from submission to shortlist without sending another email to ask what had happened.",
    );
    insert.run(
      crypto.randomUUID(),
      "Hiring lead",
      "Technology company",
      "Candidates arrived with a CV already on file, and the status history showed who had reviewed them.",
    );
  }

  const admin = db.prepare("SELECT id FROM users WHERE role = 'super_admin' LIMIT 1").get();
  if (!admin) {
    const email = process.env.ADMIN_EMAIL || "admin@talentcrafters.com";
    let password = process.env.ADMIN_PASSWORD;
    let generated = false;
    if (!password) {
      password = `Tc-${randomBytes(6).toString("hex")}-A9`;
      generated = true;
    }
    const id = crypto.randomUUID();
    db.prepare(
      "INSERT INTO users (id, email, password_hash, role, status, consent_at, created_at, updated_at) VALUES (?, ?, ?, 'super_admin', 'active', ?, ?, ?)",
    ).run(id, email.toLowerCase(), hashPassword(password), now(), now(), now());
    const accessPath = path.join(dataDir(), "ADMIN_ACCESS.txt");
    if (generated || !fs.existsSync(accessPath)) {
      fs.writeFileSync(
        accessPath,
        `Talent Crafters administrator\nEmail: ${email.toLowerCase()}\nPassword: ${password}\nChange this password after the first sign-in.\n`,
        "utf8",
      );
    }
  }
}

export function ftsEnabled() {
  return globalForDb.__tcFts === true;
}

export function getDb() {
  if (globalForDb.__tcDb) return globalForDb.__tcDb;
  const db = new DatabaseSync(path.join(dataDir(), "talent.db"));
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('super_admin','admin','recruiter','employer','candidate')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','rejected','suspended')),
      consent_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);

    CREATE TABLE IF NOT EXISTS candidate_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      country TEXT NOT NULL,
      location TEXT NOT NULL,
      career_field TEXT NOT NULL,
      years_experience INTEGER NOT NULL,
      qualification TEXT NOT NULL,
      cv_path TEXT,
      cv_original_name TEXT,
      cv_updated_at TEXT,
      bio TEXT,
      whatsapp_opt_in INTEGER NOT NULL DEFAULT 0,
      email_opt_in INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      owner_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      contact_name TEXT,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      industry TEXT,
      country TEXT,
      city TEXT,
      website TEXT,
      careers_page TEXT,
      hr_email TEXT,
      recruitment_email TEXT,
      general_email TEXT,
      phone TEXT,
      linkedin_url TEXT,
      description TEXT,
      source TEXT NOT NULL DEFAULT 'registered',
      contact_status TEXT NOT NULL DEFAULT 'unavailable',
      email_status TEXT NOT NULL DEFAULT 'unavailable',
      email_source TEXT,
      discovered_at TEXT,
      last_verified_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS companies_norm_idx ON companies(normalized_name);
    CREATE INDEX IF NOT EXISTS companies_owner_idx ON companies(owner_user_id);

    CREATE TABLE IF NOT EXISTS industries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      posted_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      requirements TEXT,
      qualifications TEXT,
      experience TEXT,
      location TEXT,
      city TEXT,
      country TEXT,
      salary_text TEXT,
      salary_min INTEGER,
      salary_max INTEGER,
      currency TEXT,
      employment_type TEXT,
      experience_level TEXT,
      industry TEXT,
      category TEXT,
      deadline TEXT,
      source_url TEXT,
      reference_code TEXT,
      origin TEXT NOT NULL CHECK (origin IN ('discovery','recruiter')),
      source_name TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      rejection_reason TEXT,
      expiry_notice_on TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      published_at TEXT,
      expired_at TEXT
    );
    CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs(status, created_at);
    CREATE INDEX IF NOT EXISTS jobs_company_idx ON jobs(company_id);
    CREATE INDEX IF NOT EXISTS jobs_posted_by_idx ON jobs(posted_by);
    CREATE UNIQUE INDEX IF NOT EXISTS jobs_source_url_idx ON jobs(source_url) WHERE source_url IS NOT NULL AND length(source_url) > 8;

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      candidate_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cv_path TEXT,
      cv_original_name TEXT,
      note TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(job_id, candidate_user_id)
    );
    CREATE INDEX IF NOT EXISTS applications_candidate_idx ON applications(candidate_user_id);
    CREATE INDEX IF NOT EXISTS applications_job_idx ON applications(job_id);

    CREATE TABLE IF NOT EXISTS application_events (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      actor_user_id TEXT,
      status TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS application_events_idx ON application_events(application_id, created_at);

    CREATE TABLE IF NOT EXISTS saved_jobs (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, job_id)
    );

    CREATE TABLE IF NOT EXISTS interviews (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      scheduled_at TEXT NOT NULL,
      mode TEXT NOT NULL,
      place TEXT,
      message TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS interviews_application_idx ON interviews(application_id);

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      sender_user_id TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS messages_application_idx ON messages(application_id, created_at);

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      href TEXT,
      email_status TEXT,
      whatsapp_status TEXT,
      read_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id, created_at);

    CREATE TABLE IF NOT EXISTS discovery_runs (
      id TEXT PRIMARY KEY,
      trigger TEXT NOT NULL,
      status TEXT NOT NULL,
      query TEXT,
      filters TEXT,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      found_count INTEGER NOT NULL DEFAULT 0,
      new_count INTEGER NOT NULL DEFAULT 0,
      duplicate_count INTEGER NOT NULL DEFAULT 0,
      enriched_count INTEGER NOT NULL DEFAULT 0,
      error TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_user_id TEXT,
      action TEXT NOT NULL,
      entity TEXT,
      entity_id TEXT,
      detail TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS audit_created_idx ON audit_logs(created_at);

    CREATE TABLE IF NOT EXISTS testimonials (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      quote TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      read_at TEXT
    );
  `);

  const columns = db.prepare("PRAGMA table_info(candidate_profiles)").all() as { name: string }[];
  if (!columns.some((column) => column.name === "first_name")) {
    db.exec("ALTER TABLE candidate_profiles ADD COLUMN first_name TEXT");
  }
  if (!columns.some((column) => column.name === "surname")) {
    db.exec("ALTER TABLE candidate_profiles ADD COLUMN surname TEXT");
  }
  db.exec(`
    UPDATE candidate_profiles
    SET first_name = trim(substr(full_name, 1, instr(full_name || ' ', ' ') - 1)),
        surname = trim(substr(full_name, instr(full_name || ' ', ' ') + 1))
    WHERE first_name IS NULL OR surname IS NULL
  `);

  let fts = false;
  try {
    db.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS jobs_fts USING fts5(job_id UNINDEXED, title, company, description, location, industry, category)`);
    fts = true;
  } catch (error) {
    console.error("Full-text search is unavailable", error);
  }
  globalForDb.__tcFts = fts;
  seed(db);
  globalForDb.__tcDb = db;
  return db;
}

export type SqlValue = string | number | null | bigint;

export function all<T>(sql: string, params: SqlValue[] = []): T[] {
  return getDb().prepare(sql).all(...params) as T[];
}

export function one<T>(sql: string, params: SqlValue[] = []): T | undefined {
  return getDb().prepare(sql).get(...params) as T | undefined;
}

export function exec(sql: string, params: SqlValue[] = []) {
  return getDb().prepare(sql).run(...params);
}
