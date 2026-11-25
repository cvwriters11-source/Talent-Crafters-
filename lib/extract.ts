import { JOB_BOARD_HOSTS } from "./constants";

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const BLOCKED_EMAIL_DOMAINS = new Set([
  "example.com",
  "email.com",
  "domain.com",
  "company.com",
  "test.com",
  "placeholder.com",
  "sentry.io",
  "wixpress.com",
  "schema.org",
  "wordpress.com",
  "godaddy.com",
  "mysite.com",
]);

export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h1|h2|h3|tr)>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .slice(0, 20000);
}

export function classifyEmail(email: string): "recruitment" | "hr" | "general" {
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  if (/(career|jobs?|recruit|talent|hiring|vacanc|apply)/.test(local)) return "recruitment";
  if (local === "hr" || /human/.test(local) || local.startsWith("hr.") || local.startsWith("hr-") || local.startsWith("hr_")) {
    return "hr";
  }
  return "general";
}

export function extractEmails(text: string): string[] {
  const found = text.match(EMAIL_RE) ?? [];
  const unique = new Set<string>();
  for (const raw of found) {
    const email = raw.replace(/[.,;:)]+$/g, "").toLowerCase();
    const domain = email.split("@")[1] ?? "";
    const local = email.split("@")[0] ?? "";
    if (!domain || local.length > 64 || domain.length > 253) continue;
    if (BLOCKED_EMAIL_DOMAINS.has(domain)) continue;
    if (/(noreply|no-reply|donotreply|do-not-reply)/.test(local)) continue;
    if (/\.(png|jpe?g|gif|webp|svg|css|js)$/i.test(email)) continue;
    unique.add(email);
  }
  return [...unique];
}

export function extractPhones(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(/tel:\s*([+\d][\d\s().-]{7,20})/gi)) {
    const digits = match[1].replace(/\D/g, "");
    if (digits.length >= 8 && digits.length <= 15) found.add(match[1].replace(/\s+/g, " ").trim());
  }
  for (const match of text.match(/\+\d{1,3}(?:[\s.-]?\d){7,14}/g) ?? []) {
    const digits = match.replace(/\D/g, "");
    if (digits.length >= 8 && digits.length <= 15) found.add(match.trim());
  }
  return [...found].slice(0, 3);
}

export function extractLinkedIn(text: string): string | null {
  const match = text.match(/https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/company\/[A-Za-z0-9\-_%]+\/?/i);
  return match ? match[0].replace(/\/$/, "") : null;
}

export function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function domainOfEmail(email: string): string {
  return (email.split("@")[1] ?? "").toLowerCase();
}

export function domainsMatch(email: string, website: string | null | undefined): boolean {
  if (!website) return false;
  const host = hostOf(website.startsWith("http") ? website : `https://${website}`);
  const emailDomain = domainOfEmail(email);
  if (!host || !emailDomain) return false;
  return host === emailDomain || host.endsWith(`.${emailDomain}`) || emailDomain.endsWith(`.${host}`) || emailDomain === host;
}

export function isJobBoardHost(host: string): boolean {
  return JOB_BOARD_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
}

export function extractCompanyWebsite(text: string, sourceUrl: string | null): string | null {
  const sourceHost = sourceUrl ? hostOf(sourceUrl) : null;
  const urls = text.match(/https?:\/\/[^\s<>"')]+/gi) ?? [];
  for (const raw of urls) {
    const clean = raw.replace(/&amp;/gi, "&").replace(/[.,);]+$/, "");
    const host = hostOf(clean);
    if (!host || isJobBoardHost(host)) continue;
    if (sourceHost && host === sourceHost) continue;
    if (host.includes("linkedin.")) continue;
    return clean.slice(0, 300);
  }
  return null;
}

export function extractReference(text: string): string | null {
  const match = text.match(/(?:ref(?:erence)?|requisition|job\s*id|req\.?\s*id)[:\s#]+([A-Z0-9][A-Z0-9\-]{2,30})/i);
  return match ? match[1].slice(0, 40) : null;
}

export function extractDeadline(text: string): string | null {
  const match = text.match(
    /(?:deadline|closing date|apply by|applications close)[:\s]+(\d{4}-\d{2}-\d{2}|\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})/i,
  );
  if (!match) return null;
  const value = match[1];
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parts = value.split(/[\/.\-]/).map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null;
  let [a, b, c] = parts;
  if (c < 100) c += 2000;
  const dayFirst = a > 12 ? { y: c, m: b, d: a } : { y: c, m: a, d: b };
  if (dayFirst.m < 1 || dayFirst.m > 12 || dayFirst.d < 1 || dayFirst.d > 31) return null;
  const iso = `${dayFirst.y}-${String(dayFirst.m).padStart(2, "0")}-${String(dayFirst.d).padStart(2, "0")}`;
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return iso;
}

export function extractYears(text: string): string | null {
  const match = text.match(/\b(\d{1,2}\s*(?:\+|–|-|to)\s*\d{0,2}\s*years?|\d{1,2}\+\s*years?)\b/i);
  return match ? match[0].replace(/\s+/g, " ") : null;
}

export function sectionAfter(text: string, labels: string[]): string {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => labels.some((label) => line.trim().toLowerCase().startsWith(label)));
  if (start < 0) return "";
  const chunk: string[] = [];
  for (const line of lines.slice(start + 1, start + 12)) {
    if (/^[A-Z][A-Za-z &/-]{2,40}:?$/.test(line.trim()) && chunk.length > 1) break;
    chunk.push(line);
  }
  return chunk.join("\n").trim().slice(0, 2500);
}

const COUNTRY_ALIASES: [string, string][] = [
  ["south africa", "South Africa"],
  ["united kingdom", "United Kingdom"],
  ["england", "United Kingdom"],
  ["scotland", "United Kingdom"],
  ["wales", "United Kingdom"],
  [" uk", "United Kingdom"],
  ["u.k.", "United Kingdom"],
  ["united states", "United States"],
  ["u.s.a", "United States"],
  ["usa", "United States"],
  ["united arab emirates", "United Arab Emirates"],
  ["dubai", "United Arab Emirates"],
  ["abu dhabi", "United Arab Emirates"],
  ["nigeria", "Nigeria"],
  ["kenya", "Kenya"],
  ["ghana", "Ghana"],
  ["egypt", "Egypt"],
  ["ireland", "Ireland"],
  ["germany", "Germany"],
  ["deutschland", "Germany"],
  ["netherlands", "Netherlands"],
  ["holland", "Netherlands"],
  ["france", "France"],
  ["canada", "Canada"],
  ["australia", "Australia"],
  ["new zealand", "New Zealand"],
  ["india", "India"],
  ["singapore", "Singapore"],
  ["johannesburg", "South Africa"],
  ["cape town", "South Africa"],
  ["durban", "South Africa"],
  ["pretoria", "South Africa"],
  ["lagos", "Nigeria"],
  ["nairobi", "Kenya"],
  ["london", "United Kingdom"],
  ["manchester", "United Kingdom"],
  ["berlin", "Germany"],
  ["amsterdam", "Netherlands"],
  ["paris", "France"],
  ["new york", "United States"],
  ["san francisco", "United States"],
  ["toronto", "Canada"],
  ["sydney", "Australia"],
  ["melbourne", "Australia"],
  ["auckland", "New Zealand"],
];

export function inferCountry(location: string): string {
  const value = ` ${location.toLowerCase()} `;
  if (!location.trim()) return "";
  for (const [needle, country] of COUNTRY_ALIASES) {
    if (value.includes(needle)) return country;
  }
  if (/\bremote\b|\bworldwide\b|\banywhere\b|\bglobal\b/.test(value)) return "Remote";
  return "";
}

export function inferCity(location: string, country: string): string {
  const cleaned = location.replace(/\bremote\b/ig, "").replace(new RegExp(country, "i"), "").replace(/[()]/g, " ");
  const part = cleaned.split(/[,|/]/).map((item) => item.trim()).filter(Boolean)[0];
  if (!part || part.length > 60) return "";
  return part;
}

const INDUSTRY_KEYWORDS: [string, string[]][] = [
  ["Information Technology", ["software", "developer", "engineering", "data", "it ", "devops", "cyber", "cloud", "tech"]],
  ["Finance & Accounting", ["account", "finance", "audit", "bank", "tax"]],
  ["Engineering", ["mechanical", "civil", "electrical", "engineer"]],
  ["Healthcare", ["health", "nurse", "clinic", "medical", "pharma"]],
  ["Education", ["teacher", "education", "lecturer", "school"]],
  ["Sales & Marketing", ["sales", "marketing", "brand", "growth"]],
  ["Human Resources", ["human resource", "recruiter", "talent", "hr "]],
  ["Legal", ["legal", "attorney", "lawyer", "compliance"]],
  ["Hospitality", ["hotel", "hospitality", "chef", "restaurant"]],
  ["Logistics & Supply Chain", ["logistics", "supply", "warehouse", "fleet"]],
  ["Construction", ["construction", "quantity survey", "site"]],
  ["Mining & Energy", ["mining", "energy", "oil", "gas"]],
  ["Customer Service", ["customer", "support", "call centre", "call center"]],
  ["Administration", ["admin", "office", "assistant", "operations"]],
];

export function inferIndustry(text: string, known: string[]): string {
  const direct = known.find((item) => text.toLowerCase().includes(item.toLowerCase()));
  if (direct) return direct;
  const hay = text.toLowerCase();
  for (const [industry, words] of INDUSTRY_KEYWORDS) {
    if (words.some((word) => hay.includes(word))) return industry;
  }
  return "Other";
}

export function inferEmployment(text: string): string {
  const hay = text.toLowerCase();
  if (hay.includes("intern")) return "Internship";
  if (hay.includes("part-time") || hay.includes("part time")) return "Part-time";
  if (hay.includes("contract")) return "Contract";
  if (hay.includes("temporary") || hay.includes("temp ")) return "Temporary";
  if (hay.includes("remote")) return "Remote";
  if (hay.includes("full")) return "Full-time";
  return "Full-time";
}

export function inferLevel(text: string): string {
  const hay = text.toLowerCase();
  if (hay.includes("intern")) return "Internship";
  if (/\b(chief|director|head of|vp|vice president|executive)\b/.test(hay)) return "Executive";
  if (/\b(lead|principal|staff)\b/.test(hay)) return "Lead";
  if (hay.includes("senior") || hay.includes("sr.")) return "Senior";
  if (hay.includes("junior") || hay.includes("jr.") || hay.includes("graduate")) return "Junior";
  if (hay.includes("mid")) return "Mid-level";
  return "Mid-level";
}

export function parseSalary(text: string): { min: number | null; max: number | null; currency: string | null } {
  if (!text) return { min: null, max: null, currency: null };
  const currency = text.match(/[$£€]|USD|EUR|GBP|ZAR|AUD|CAD|R\b/)?.[0] ?? null;
  const numbers = [...text.replace(/,/g, "").matchAll(/\d{2,7}(?:\.\d+)?\s*k?/gi)].map((match) => {
    const raw = match[0].toLowerCase();
    const value = Number.parseFloat(raw);
    return raw.includes("k") ? Math.round(value * 1000) : Math.round(value);
  }).filter((value) => value >= 1000 && value <= 5000000);
  if (!numbers.length) return { min: null, max: null, currency };
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  return { min, max, currency };
}

export function robotsAllows(robotsTxt: string, path: string, userAgent: string): boolean {
  const lines = robotsTxt.split(/\r?\n/).map((line) => line.replace(/#.*$/, "").trim()).filter(Boolean);
  type Group = { agents: string[]; rules: { allow: boolean; path: string }[] };
  const groups: Group[] = [];
  let current: Group | null = null;
  for (const line of lines) {
    const index = line.indexOf(":");
    if (index < 0) continue;
    const key = line.slice(0, index).trim().toLowerCase();
    const value = line.slice(index + 1).trim();
    if (key === "user-agent") {
      if (!current || current.rules.length) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if ((key === "allow" || key === "disallow") && current) {
      current.rules.push({ allow: key === "allow", path: value });
    }
  }
  const ua = userAgent.toLowerCase();
  const specific = groups.filter((group) => group.agents.some((agent) => agent !== "*" && ua.includes(agent)));
  const chosen = specific.length ? specific : groups.filter((group) => group.agents.includes("*"));
  let best: { length: number; allow: boolean } | null = null;
  for (const group of chosen) {
    for (const rule of group.rules) {
      if (!rule.path) continue;
      const prefix = rule.path.replace(/\$$/, "");
      if (path.startsWith(prefix)) {
        if (!best || prefix.length > best.length || (prefix.length === best.length && rule.allow)) {
          best = { length: prefix.length, allow: rule.allow };
        }
      }
    }
  }
  return best ? best.allow : true;
}

export function normaliseCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(proprietary|pty|ltd|limited|inc|llc|gmbh|plc|corp|corporation|co|company)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}
