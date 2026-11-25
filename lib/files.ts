import fs from "fs";
import path from "path";
import { dataDir } from "./db";

const TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

function signatureOk(bytes: Buffer, extension: string) {
  if (extension === "pdf") return bytes.subarray(0, 4).toString() === "%PDF";
  if (extension === "docx") return bytes[0] === 0x50 && bytes[1] === 0x4b;
  if (extension === "doc") return bytes[0] === 0xd0 && bytes[1] === 0xcf;
  return false;
}

export async function storeCv(file: File, userId: string) {
  if (!file || file.size === 0) throw new Error("Upload a CV in PDF or Word format.");
  if (file.size > 5 * 1024 * 1024) throw new Error("CV files must be 5 MB or smaller.");
  const fromName = file.name.toLowerCase().endsWith(".pdf")
    ? "pdf"
    : file.name.toLowerCase().endsWith(".docx")
      ? "docx"
      : file.name.toLowerCase().endsWith(".doc")
        ? "doc"
        : "";
  const extension = TYPES[file.type] || fromName;
  if (!extension) throw new Error("Upload a PDF, DOC, or DOCX file.");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!signatureOk(bytes, extension)) throw new Error("The file contents do not match a PDF or Word document.");
  const relative = path.join(userId, `${crypto.randomUUID()}.${extension}`);
  const absolute = path.join(dataDir(), "cvs", relative);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, bytes);
  return { relative: relative.replaceAll("\\", "/"), name: file.name.slice(0, 180) };
}

export function resolveCv(relative: string) {
  const root = path.resolve(dataDir(), "cvs");
  const absolute = path.resolve(root, relative);
  if (!absolute.startsWith(root)) return null;
  if (!fs.existsSync(absolute)) return null;
  return absolute;
}

export function removeCv(relative: string | null | undefined) {
  if (!relative) return;
  const absolute = resolveCv(relative);
  if (absolute) fs.rmSync(absolute, { force: true });
}
