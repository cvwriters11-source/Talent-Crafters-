import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { audit, exportCompanies, exportReport } from "@/lib/repo";

export const dynamic = "force-dynamic";

function csv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`).join(","));
  }
  return lines.join("\n");
}

function spreadsheet(rows: Record<string, unknown>[]) {
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  const cells = (value: unknown) => `<Cell><Data ss:Type="String">${String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")}</Data></Cell>`;
  const header = `<Row>${headers.map((header) => cells(header)).join("")}</Row>`;
  const body = rows.map((row) => `<Row>${headers.map((header) => cells(row[header])).join("")}</Row>`).join("");
  return `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Companies"><Table>${header}${body}</Table></Worksheet></Workbook>`;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) return new NextResponse("Not allowed", { status: 403 });
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const format = url.searchParams.get("format");
  if (kind === "report") {
    const report = exportReport();
    const rows = [
      ...report.users.map((row) => ({ section: "users", ...row })),
      ...report.jobs.map((row) => ({ section: "jobs", ...row })),
      ...report.applications.map((row) => ({ section: "applications", ...row })),
    ];
    audit(user.id, "export", "report", null, "platform report");
    return new NextResponse(csv(rows as Record<string, unknown>[]), {
      headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=talent-crafters-report.csv" },
    });
  }
  const rows = exportCompanies().map((company) => ({
    name: company.name,
    industry: company.industry,
    country: company.country,
    city: company.city,
    website: company.website,
    careers_page: company.careers_page,
    hr_email: company.hr_email,
    recruitment_email: company.recruitment_email,
    general_email: company.general_email,
    phone: company.phone,
    linkedin_url: company.linkedin_url,
    email_status: company.email_status,
    contact_status: company.contact_status,
    discovered_at: company.discovered_at,
    last_verified_at: company.last_verified_at,
  }));
  audit(user.id, "export", "companies", null, format || "csv");
  if (format === "xls") {
    return new NextResponse(spreadsheet(rows), {
      headers: { "Content-Type": "application/vnd.ms-excel", "Content-Disposition": "attachment; filename=talent-crafters-companies.xls" },
    });
  }
  return new NextResponse(csv(rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=talent-crafters-companies.csv" },
  });
}
