export const SITE_NAME = "Talent Crafters Recruitment";

export const USER_AGENT =
  "TalentCraftersDiscovery/1.0 (public vacancy aggregation for admin review; +https://talentcrafters.local/contact)";

export const COUNTRIES = [
  "South Africa",
  "Nigeria",
  "Kenya",
  "Ghana",
  "Egypt",
  "United Kingdom",
  "Ireland",
  "Germany",
  "Netherlands",
  "France",
  "United States",
  "Canada",
  "United Arab Emirates",
  "Australia",
  "New Zealand",
  "India",
  "Singapore",
  "Remote",
] as const;

export const QUALIFICATIONS = [
  "Matric / High school",
  "Certificate",
  "Diploma",
  "Bachelor's degree",
  "Honours degree",
  "Master's degree",
  "Doctorate",
  "Trade certification",
  "Other",
] as const;

export const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
  "Internship",
  "Remote",
] as const;

export const EXPERIENCE_LEVELS = [
  "Internship",
  "Junior",
  "Mid-level",
  "Senior",
  "Lead",
  "Executive",
] as const;

export const SALARY_BANDS = [
  { id: "", label: "Any advertised salary" },
  { id: "0-15000", label: "Under 15,000" },
  { id: "15000-40000", label: "15,000 – 40,000" },
  { id: "40000-80000", label: "40,000 – 80,000" },
  { id: "80000-150000", label: "80,000 – 150,000" },
  { id: "150000+", label: "150,000 and above" },
] as const;

export const APPLICATION_STATUSES = [
  "pending",
  "under_review",
  "shortlisted",
  "interview",
  "rejected",
  "successful",
] as const;

export const JOB_STATUSES = [
  "pending",
  "approved",
  "published",
  "unpublished",
  "rejected",
  "expired",
  "archived",
] as const;

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  under_review: "Under review",
  shortlisted: "Shortlisted",
  interview: "Interview invited",
  rejected: "Rejected",
  successful: "Successful",
  approved: "Approved",
  published: "Published",
  unpublished: "Unpublished",
  expired: "Expired",
  archived: "Archived",
  active: "Active",
  suspended: "Suspended",
  verified: "Verified company domain",
  unverified: "Unverified",
  unavailable: "Unavailable",
};

export const INDUSTRY_SEEDS = [
  "Information Technology",
  "Finance & Accounting",
  "Engineering",
  "Healthcare",
  "Education",
  "Sales & Marketing",
  "Human Resources",
  "Legal",
  "Hospitality",
  "Logistics & Supply Chain",
  "Construction",
  "Administration",
  "Mining & Energy",
  "Customer Service",
];

export const CATEGORY_SEEDS = [
  "Software Engineering",
  "Data & Analytics",
  "Accounting",
  "Nursing",
  "Project Management",
  "Sales",
  "Marketing",
  "Operations",
  "Design",
  "Executive",
  "Internship",
  "Other",
];

export const ADZUNA_COUNTRY_CODES: Record<string, string> = {
  "South Africa": "za",
  "United Kingdom": "gb",
  "United States": "us",
  "Canada": "ca",
  Germany: "de",
  France: "fr",
  Netherlands: "nl",
  Australia: "au",
  "New Zealand": "nz",
  India: "in",
  Singapore: "sg",
  Ireland: "ie",
  Austria: "at",
  Brazil: "br",
  Poland: "pl",
};

export const JOB_BOARD_HOSTS = [
  "remotive.com",
  "arbeitnow.com",
  "jobicy.com",
  "himalayas.app",
  "linkedin.com",
  "indeed.com",
  "glassdoor.com",
  "ziprecruiter.com",
  "adzuna.com",
  "adzuna.co.za",
  "adzuna.co.uk",
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "google.com",
  "youtube.com",
  "wikipedia.org",
];
