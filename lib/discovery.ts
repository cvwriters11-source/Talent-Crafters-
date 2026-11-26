import { ADZUNA_COUNTRY_CODES, SOUTHERN_AFRICA, USER_AGENT } from "./constants";
import {
  classifyEmail,
  domainsMatch,
  extractCompanyWebsite,
  extractDeadline,
  extractEmails,
  extractLinkedIn,
  extractPhones,
  extractReference,
  extractYears,
  hostOf,
  htmlToText,
  inferCity,
  inferCountry,
  inferEmployment,
  inferIndustry,
  inferLevel,
  isJobBoardHost,
  parseSalary,
  robotsAllows,
  sectionAfter,
} from "./extract";
import {
  adminIds,
  createCompany,
  createJob,
  discoverySettings,
  duplicateJob,
  findCompanyByName,
  finishRun,
  listCategories,
  listIndustries,
  markStaleRuns,
  saveDiscoverySettings,
  startRun,
  updateCompany,
} from "./repo";
import { notify } from "./notify";

export type RawVacancy = {
  sourceName: string;
  company: string;
  title: string;
  descriptionHtml: string;
  location: string;
  url: string;
  salaryText: string;
  employment: string;
  category: string;
  level: string;
  deadline?: string;
};

const running = { current: false };

async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(12000),
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`${response.status} from ${url}`);
  return response.json() as Promise<unknown>;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

async function fromRemotive(query: string): Promise<RawVacancy[]> {
  const url = new URL("https://remotive.com/api/remote-jobs");
  if (query) url.searchParams.set("search", query);
  const payload = asRecord(await fetchJson(url.toString()));
  const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
  return jobs.slice(0, 30).map((item) => {
    const job = asRecord(item);
    return {
      sourceName: "Remotive",
      company: text(job.company_name),
      title: text(job.title),
      descriptionHtml: text(job.description),
      location: text(job.candidate_required_location),
      url: text(job.url),
      salaryText: text(job.salary),
      employment: text(job.job_type),
      category: text(job.category),
      level: "",
    };
  });
}

async function fromArbeitnow(query: string): Promise<RawVacancy[]> {
  const payload = asRecord(await fetchJson("https://www.arbeitnow.com/api/job-board-api"));
  const jobs = Array.isArray(payload.data) ? payload.data : [];
  const needle = query.toLowerCase();
  return jobs
    .filter((item) => {
      const job = asRecord(item);
      if (!needle) return true;
      return `${text(job.title)} ${text(job.company_name)} ${text(job.description)}`.toLowerCase().includes(needle);
    })
    .slice(0, 30)
    .map((item) => {
      const job = asRecord(item);
      const tags = Array.isArray(job.tags) ? job.tags.map(text).join(", ") : "";
      const types = Array.isArray(job.job_types) ? job.job_types.map(text).join(", ") : "";
      return {
        sourceName: "Arbeitnow",
        company: text(job.company_name),
        title: text(job.title),
        descriptionHtml: text(job.description),
        location: text(job.location) || (job.remote ? "Remote" : ""),
        url: text(job.url),
        salaryText: "",
        employment: types,
        category: tags,
        level: "",
      };
    });
}

async function fromJobicy(query: string): Promise<RawVacancy[]> {
  const url = new URL("https://jobicy.com/api/v2/remote-jobs");
  url.searchParams.set("count", "30");
  if (query) url.searchParams.set("tag", query);
  const payload = asRecord(await fetchJson(url.toString()));
  const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
  return jobs.slice(0, 30).map((item) => {
    const job = asRecord(item);
    const geo = text(job.jobGeo);
    return {
      sourceName: "Jobicy",
      company: text(job.companyName),
      title: text(job.jobTitle),
      descriptionHtml: text(job.jobDescription) || text(job.jobExcerpt),
      location: geo,
      url: text(job.url),
      salaryText: [job.salaryMin, job.salaryMax].filter(Boolean).join(" - ") + (job.salaryCurrency ? ` ${text(job.salaryCurrency)}` : ""),
      employment: Array.isArray(job.jobType) ? job.jobType.map(text).join(", ") : text(job.jobType),
      category: Array.isArray(job.jobIndustry) ? job.jobIndustry.map(text).join(", ") : text(job.jobIndustry),
      level: text(job.jobLevel),
    };
  });
}

async function fromHimalayas(query: string): Promise<RawVacancy[]> {
  const payload = asRecord(await fetchJson("https://himalayas.app/jobs/api?limit=20"));
  const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
  const needle = query.toLowerCase();
  return jobs
    .filter((item) => {
      const job = asRecord(item);
      if (!needle) return true;
      return `${text(job.title)} ${text(job.companyName)} ${text(job.excerpt)}`.toLowerCase().includes(needle);
    })
    .slice(0, 20)
    .map((item) => {
      const job = asRecord(item);
      const restrictions = Array.isArray(job.locationRestrictions) ? job.locationRestrictions.map(text).join(", ") : text(job.locationRestrictions);
      const level = Array.isArray(job.seniority) ? job.seniority.map(text).join(", ") : text(job.seniority);
      const categories = Array.isArray(job.categories) ? job.categories.map(text).join(", ") : "";
      const min = typeof job.minSalary === "number" ? job.minSalary : null;
      const max = typeof job.maxSalary === "number" ? job.maxSalary : null;
      const expiry = typeof job.expiryDate === "number" ? job.expiryDate : null;
      if (expiry && expiry * 1000 < Date.now()) return null;
      return {
        sourceName: "Himalayas",
        company: text(job.companyName),
        title: text(job.title),
        descriptionHtml: text(job.description) || text(job.excerpt),
        location: restrictions || "Remote",
        url: text(job.applicationLink) || text(job.url),
        salaryText: min || max ? `${min ?? ""} - ${max ?? ""} ${text(job.currency)}`.trim() : "",
        employment: text(job.employmentType) || "Remote",
        category: categories,
        level,
        deadline: expiry ? new Date(expiry * 1000).toISOString().slice(0, 10) : "",
      };
    })
    .filter((item): item is RawVacancy => Boolean(item));
}

const YUBHUB_CITIES: { slug: string; city: string; country: (typeof SOUTHERN_AFRICA)[number] }[] = [
  { slug: "johannesburg", city: "Johannesburg", country: "South Africa" },
  { slug: "cape-town", city: "Cape Town", country: "South Africa" },
  { slug: "pretoria", city: "Pretoria", country: "South Africa" },
  { slug: "durban", city: "Durban", country: "South Africa" },
  { slug: "bloemfontein", city: "Bloemfontein", country: "South Africa" },
  { slug: "gaborone", city: "Gaborone", country: "Botswana" },
  { slug: "francistown", city: "Francistown", country: "Botswana" },
  { slug: "maseru", city: "Maseru", country: "Lesotho" },
  { slug: "mbabane", city: "Mbabane", country: "Eswatini" },
  { slug: "manzini", city: "Manzini", country: "Eswatini" },
  { slug: "harare", city: "Harare", country: "Zimbabwe" },
  { slug: "bulawayo", city: "Bulawayo", country: "Zimbabwe" },
];

function wantsCountry(countries: string[], country: string) {
  return countries.length === 0 || countries.includes(country);
}

function decodeHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fromYubHub(countries: string[]): Promise<RawVacancy[]> {
  const cities = YUBHUB_CITIES.filter((city) => wantsCountry(countries, city.country));
  const collected: RawVacancy[] = [];
  const failures: string[] = [];
  for (const city of cities) {
    try {
      const payload = asRecord(await fetchJson(`https://feeds.yubhub.co/facet/city/${city.slug}.json`));
      const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
      for (const item of jobs.slice(0, 8)) {
        const job = asRecord(item);
        const company = text(asRecord(job.hiringOrganization).name);
        const title = text(job.title);
        const url = text(job["x-apply-url"]) || text(job.url);
        if (!company || !title || !url) continue;
        collected.push({
          sourceName: "YubHub",
          company,
          title,
          descriptionHtml: `${text(job.description)}\n\nData by YubHub (https://yubhub.co).`,
          location: `${city.city}, ${city.country}`,
          url,
          salaryText: "",
          employment: text(job["x-job-type"]) || text(job.employmentType),
          category: text(job.industry) || text(job.occupationalCategory),
          level: text(job["x-experience-level"]),
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "request failed";
      if (!message.startsWith("404")) failures.push(`${city.city}: ${message}`);
    }
  }
  if (!collected.length && failures.length) throw new Error(failures.slice(0, 3).join("; "));
  return collected;
}

async function fromMyJobMag(countries: string[]): Promise<RawVacancy[]> {
  if (!wantsCountry(countries, "South Africa")) return [];
  const response = await fetch("https://www.myjobmag.co.za/", {
    headers: { Accept: "text/html", "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(15000),
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`${response.status} from MyJobMag`);
  const html = await response.text();
  const vacancies: RawVacancy[] = [];
  for (const block of html.split('<li class="job-info">').slice(1)) {
    const companyRaw = decodeHtml(block.match(/<h2>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i)?.[1] ?? "");
    const company = companyRaw.replace(/^.*\bat\s+/i, "").trim();
    const excerpt = decodeHtml(block.match(/class="job-desc">([\s\S]*?)<\/li>/i)?.[1] ?? "");
    let taken = 0;
    for (const link of block.matchAll(/href="(\/job\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
      if (vacancies.length >= 24 || taken >= 4) break;
      const title = decodeHtml(link[2]);
      if (!company || title.length < 3) continue;
      vacancies.push({
        sourceName: "MyJobMag",
        company,
        title: title.slice(0, 180),
        descriptionHtml: excerpt || `${title} at ${company} in South Africa. Open the original advertisement for the full description.`,
        location: "South Africa",
        url: `https://www.myjobmag.co.za${link[1]}`,
        salaryText: "",
        employment: "",
        category: "",
        level: "",
      });
      taken += 1;
    }
  }
  return vacancies;
}

async function fromJobHunters(countries: string[]): Promise<RawVacancy[]> {
  if (!wantsCountry(countries, "Zimbabwe")) return [];
  const payload = asRecord(await fetchJson("https://api.jobhunters.co.zw/api/jobs/?page=1"));
  const results = Array.isArray(payload.results) ? payload.results : [];
  const collected: RawVacancy[] = [];
  for (const item of results) {
    const job = asRecord(item);
    const expiry = text(job.expiry_date);
    if (expiry && Date.parse(expiry) < Date.now()) continue;
    const url = text(job.apply_url);
    if (!url.startsWith("http")) continue;
    const location = asRecord(job.location);
    const employer = asRecord(job.employer);
    const title = text(job.title);
    const company = text(employer.company_name);
    if (!title || !company) continue;
    const city = text(location.city) || text(location.name) || "Zimbabwe";
    collected.push({
      sourceName: "JobHunters",
      company,
      title,
      descriptionHtml: text(job.description) || text(job.requirements),
      location: `${city}, Zimbabwe`,
      url,
      salaryText: "",
      employment: text(job.employment_type).replaceAll("_", " "),
      category: text(asRecord(job.sector).name),
      level: text(job.experience_level).replaceAll("_", " "),
      deadline: expiry ? expiry.slice(0, 10) : "",
    });
  }
  return collected;
}

async function fromAdzuna(query: string, countries: string[]): Promise<RawVacancy[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];
  const codes = (countries.length ? countries : ["South Africa", "United Kingdom"])
    .map((country) => ADZUNA_COUNTRY_CODES[country])
    .filter(Boolean)
    .slice(0, 4);
  const collected: RawVacancy[] = [];
  for (const code of codes) {
    const url = new URL(`https://api.adzuna.com/v1/api/jobs/${code}/search/1`);
    url.searchParams.set("app_id", appId);
    url.searchParams.set("app_key", appKey);
    url.searchParams.set("results_per_page", "20");
    if (query) url.searchParams.set("what", query);
    const payload = asRecord(await fetchJson(url.toString()));
    const jobs = Array.isArray(payload.results) ? payload.results : [];
    for (const item of jobs) {
      const job = asRecord(item);
      const company = asRecord(job.company);
      const location = asRecord(job.location);
      const category = asRecord(job.category);
      const min = typeof job.salary_min === "number" ? Math.round(job.salary_min) : null;
      const max = typeof job.salary_max === "number" ? Math.round(job.salary_max) : null;
      collected.push({
        sourceName: "Adzuna",
        company: text(company.display_name),
        title: text(job.title),
        descriptionHtml: text(job.description),
        location: text(location.display_name),
        url: text(job.redirect_url),
        salaryText: min || max ? `${min ?? ""} - ${max ?? ""}` : "",
        employment: text(job.contract_time),
        category: text(category.label),
        level: "",
      });
    }
  }
  return collected;
}

function matchesFilters(vacancy: { country: string; industry: string; category: string; location: string }, filters: { countries: string[]; industries: string[]; categories: string[] }) {
  if (filters.countries.length && vacancy.country && !filters.countries.includes(vacancy.country)) return false;
  if (filters.countries.length && !vacancy.country) {
    const hay = vacancy.location.toLowerCase();
    const ok = filters.countries.some((country) => hay.includes(country.toLowerCase()));
    if (!ok) return false;
  }
  if (filters.industries.length && !filters.industries.includes(vacancy.industry)) return false;
  if (filters.categories.length && vacancy.category && !filters.categories.some((category) => vacancy.category.toLowerCase().includes(category.toLowerCase()))) {
    return false;
  }
  return true;
}

async function enrichCompany(website: string) {
  const host = hostOf(website);
  if (!host || isJobBoardHost(host)) return null;
  const page = new URL(website.startsWith("http") ? website : `https://${website}`);
  if (!["http:", "https:"].includes(page.protocol)) return null;
  let robots = "";
  try {
    const robotsResponse = await fetch(`${page.origin}/robots.txt`, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(6000),
    });
    if (robotsResponse.status === 401 || robotsResponse.status === 403) return null;
    if (robotsResponse.ok) robots = await robotsResponse.text();
  } catch {
    return null;
  }
  if (robots && !robotsAllows(robots, page.pathname || "/", USER_AGENT)) return null;
  await new Promise((resolve) => setTimeout(resolve, 700));
  const response = await fetch(page, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    signal: AbortSignal.timeout(8000),
    redirect: "follow",
  });
  if (!response.ok) return null;
  const type = response.headers.get("content-type") || "";
  if (!type.includes("html")) return null;
  const html = (await response.text()).slice(0, 400000);
  return {
    emails: extractEmails(html),
    phones: extractPhones(html),
    linkedin: extractLinkedIn(html),
  };
}

function pickEmails(emails: string[], website: string | null) {
  const ranked = emails.map((email) => ({
    email,
    kind: classifyEmail(email),
    verified: domainsMatch(email, website),
  }));
  ranked.sort((a, b) => Number(b.verified) - Number(a.verified));
  const recruitment = ranked.find((item) => item.kind === "recruitment");
  const hr = ranked.find((item) => item.kind === "hr");
  const general = ranked.find((item) => item.kind === "general");
  const best = ranked[0];
  return {
    recruitment: recruitment?.email ?? null,
    hr: hr?.email ?? null,
    general: !recruitment && !hr ? general?.email ?? null : general && general.email !== recruitment?.email && general.email !== hr?.email ? general.email : null,
    status: !best ? "unavailable" : best.verified ? "verified" : "unverified",
  };
}

export async function runDiscovery(options: {
  trigger: "manual" | "scheduled";
  query?: string;
  countries?: string[];
  industries?: string[];
  categories?: string[];
}) {
  if (running.current) return { skipped: true as const };
  running.current = true;
  markStaleRuns();
  const settings = discoverySettings();
  const query = (options.query ?? settings.defaultQuery ?? "").trim();
  const filters = {
    countries: options.countries ?? settings.countries,
    industries: options.industries ?? settings.industries,
    categories: options.categories ?? settings.categories,
  };
  const runId = startRun(options.trigger, query, JSON.stringify(filters));
  let found = 0;
  let created = 0;
  let duplicates = 0;
  let enriched = 0;
  const errors: string[] = [];
  try {
    const industries = listIndustries().map((item) => item.name);
    const categories = listCategories().map((item) => item.name);
    const sources = [
      ["Remotive", () => fromRemotive(query)],
      ["Arbeitnow", () => fromArbeitnow(query)],
      ["Jobicy", () => fromJobicy(query)],
      ["Himalayas", () => fromHimalayas(query)],
      ["YubHub", () => fromYubHub(filters.countries)],
      ["MyJobMag", () => fromMyJobMag(filters.countries)],
      ["JobHunters", () => fromJobHunters(filters.countries)],
      ["Adzuna", () => fromAdzuna(query, filters.countries)],
    ] as const;
    const settled = await Promise.allSettled(sources.map(([, load]) => load()));
    const vacancies: RawVacancy[] = [];
    settled.forEach((result, index) => {
      if (result.status === "fulfilled") vacancies.push(...result.value);
      else errors.push(`${sources[index][0]}: ${result.reason instanceof Error ? result.reason.message : "request failed"}`);
    });
    found = vacancies.length;
    const companiesToEnrich: { id: string; website: string }[] = [];
    for (const vacancy of vacancies) {
      if (!vacancy.company.trim() || !vacancy.title.trim() || !vacancy.url.trim()) continue;
      const description = htmlToText(vacancy.descriptionHtml || "");
      const combined = `${vacancy.title}\n${vacancy.location}\n${vacancy.category}\n${description}`;
      const country = inferCountry(`${vacancy.location} ${description.slice(0, 400)}`);
      const industry = inferIndustry(`${vacancy.category} ${vacancy.title} ${description.slice(0, 500)}`, industries);
      const category = categories.find((item) => `${vacancy.category} ${vacancy.title}`.toLowerCase().includes(item.toLowerCase())) || vacancy.category.slice(0, 80) || "Other";
      if (!matchesFilters({ country, industry, category, location: vacancy.location }, filters)) continue;
      if (duplicateJob({ sourceUrl: vacancy.url, reference: extractReference(description), companyName: vacancy.company, title: vacancy.title, country })) {
        duplicates += 1;
        continue;
      }
      const emails = extractEmails(vacancy.descriptionHtml || description);
      const phones = extractPhones(vacancy.descriptionHtml || "");
      const linkedin = extractLinkedIn(vacancy.descriptionHtml || "");
      const website = extractCompanyWebsite(vacancy.descriptionHtml || "", vacancy.url);
      const emailPick = pickEmails(emails, website);
      let company = findCompanyByName(vacancy.company);
      if (!company) {
        const id = createCompany({
          name: vacancy.company,
          source: "discovered",
          industry,
          country,
          city: inferCity(vacancy.location, country),
          website,
          careers_page: null,
          hr_email: emailPick.hr,
          recruitment_email: emailPick.recruitment,
          general_email: emailPick.general,
          phone: phones[0] ?? null,
          linkedin_url: linkedin,
          description: null,
          contact_status: emailPick.status === "unavailable" && !phones[0] ? "unavailable" : emailPick.status === "verified" ? "verified" : phones[0] || emails.length ? "unverified" : "unavailable",
          email_status: emailPick.status,
          email_source: emails.length ? "advertisement" : null,
          discovered_at: new Date().toISOString().slice(0, 19).replace("T", " "),
          last_verified_at: emails.length ? new Date().toISOString().slice(0, 19).replace("T", " ") : null,
        });
        company = findCompanyByName(vacancy.company);
        if (website && company && emailPick.status !== "verified" && companiesToEnrich.length < 5) {
          companiesToEnrich.push({ id, website });
        }
      }
      if (!company) continue;
      const salary = parseSalary(vacancy.salaryText);
      const requirements = sectionAfter(description, ["requirements", "what you will need", "what you'll need", "your profile"]);
      const qualifications = sectionAfter(description, ["qualifications", "education"]);
      try {
        createJob({
          company_id: company.id,
          posted_by: null,
          title: vacancy.title.slice(0, 180),
          description: description || "The source listing did not include a description.",
          requirements: requirements || null,
          qualifications: qualifications || null,
          experience: vacancy.level || extractYears(description),
          location: vacancy.location || country || null,
          city: inferCity(vacancy.location, country) || null,
          country: country || null,
          salary_text: vacancy.salaryText.trim() || null,
          salary_min: salary.min,
          salary_max: salary.max,
          currency: salary.currency,
          employment_type: inferEmployment(`${vacancy.employment} ${vacancy.title} ${vacancy.location}`),
          experience_level: inferLevel(`${vacancy.level} ${vacancy.title}`),
          industry,
          category,
          deadline: vacancy.deadline || extractDeadline(description),
          source_url: vacancy.url.slice(0, 500),
          reference_code: extractReference(description),
          origin: "discovery",
          source_name: vacancy.sourceName,
          status: "pending",
        });
        created += 1;
      } catch {
        duplicates += 1;
      }
    }

    for (const target of companiesToEnrich) {
      try {
        const extra = await enrichCompany(target.website);
        if (!extra) continue;
        const company = (await import("./repo")).getCompany(target.id);
        if (!company) continue;
        const merged = [...new Set([...extractEmails([company.hr_email, company.recruitment_email, company.general_email].filter(Boolean).join(" ")), ...extra.emails])];
        const emailPick = pickEmails(merged, company.website || target.website);
        const phone = company.phone || extra.phones[0] || null;
        const verified = emailPick.status === "verified";
        updateCompany(company.id, {
          hr_email: company.hr_email || emailPick.hr,
          recruitment_email: company.recruitment_email || emailPick.recruitment,
          general_email: company.general_email || emailPick.general,
          phone,
          linkedin_url: company.linkedin_url || extra.linkedin,
          email_status: emailPick.status,
          email_source: extra.emails.length ? "company_website" : company.email_source,
          contact_status: verified ? "verified" : emailPick.status === "unverified" || phone ? "unverified" : "unavailable",
          last_verified_at: new Date().toISOString().slice(0, 19).replace("T", " "),
        });
        enriched += 1;
      } catch (error) {
        errors.push(`Contact lookup: ${error instanceof Error ? error.message : "skipped"}`);
      }
    }

    if (created > 0) {
      await Promise.all(
        adminIds().map((admin) =>
          notify({
            userId: admin.id,
            title: "New vacancies awaiting review",
            body: `${created} discovered ${created === 1 ? "vacancy is" : "vacancies are"} in the approval queue.`,
            href: "/admin/discovery",
          }),
        ),
      );
    }
    if (options.trigger === "scheduled") {
      saveDiscoverySettings({ ...discoverySettings(), lastScheduledAt: new Date().toISOString() });
    }
    const status = created === 0 && errors.length && found === 0 ? "failed" : "completed";
    finishRun(runId, { status, found, created, duplicates, enriched, error: errors.slice(0, 6).join(" | ") });
    return { skipped: false as const, found, created, duplicates, enriched, errors };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Discovery failed";
    finishRun(runId, { status: "failed", found, created, duplicates, enriched, error: message });
    return { skipped: false as const, found, created, duplicates, enriched, errors: [message] };
  } finally {
    running.current = false;
  }
}

export async function discoveryTick() {
  const { expireDueJobs, adminIds: admins } = await import("./repo");
  const due = expireDueJobs();
  for (const job of due.expired) {
    const recipients = job.posted_by ? [{ id: job.posted_by }] : admins();
    for (const person of recipients) {
      await notify({
        userId: person.id,
        title: "Vacancy expired",
        body: `${job.title} passed its advertised closing date and was flagged as expired.`,
        href: `/admin/jobs/${job.id}`,
      });
    }
  }
  for (const job of due.expiring) {
    const recipients = job.posted_by ? [{ id: job.posted_by }] : admins();
    for (const person of recipients) {
      await notify({
        userId: person.id,
        title: "Vacancy closing soon",
        body: `${job.title} closes on ${job.deadline}.`,
        href: `/admin/jobs/${job.id}`,
      });
    }
  }
  const settings = discoverySettings();
  if (!settings.running) return;
  const interval = Math.max(15, settings.intervalMinutes || 360);
  if (settings.lastScheduledAt) {
    const dueAt = Date.parse(settings.lastScheduledAt) + interval * 60_000;
    if (Number.isFinite(dueAt) && Date.now() < dueAt) return;
  }
  await runDiscovery({ trigger: "scheduled" });
}
