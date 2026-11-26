import nodemailer from "nodemailer";
import { getCandidate, getUserById, notifyUser } from "./repo";

export async function deliverEmail(to: string, subject: string, text: string) {
  const host = process.env.SMTP_HOST;
  if (!host) return "not_configured";
  try {
    const transport = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_PORT === "465",
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
    });
    return "sent";
  } catch (error) {
    console.error("Email notification failed", error);
    return "failed";
  }
}

async function sendWhatsApp(phone: string, text: string) {
  const url = process.env.WHATSAPP_WEBHOOK_URL;
  if (!url || !phone) return "not_configured";
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, text }),
      signal: AbortSignal.timeout(8000),
    });
    return response.ok ? "sent" : "failed";
  } catch (error) {
    console.error("WhatsApp notification failed", error);
    return "failed";
  }
}

export async function notify(input: { userId: string; title: string; body: string; href?: string; email?: boolean; whatsapp?: boolean }) {
  const user = getUserById(input.userId);
  if (!user) return;
  const profile = user.role === "candidate" ? getCandidate(user.id) : undefined;
  const allowEmail = input.email !== false && (profile ? profile.email_opt_in === 1 : true);
  const allowWhatsApp = Boolean(input.whatsapp && profile?.whatsapp_opt_in === 1 && profile.phone);
  const emailStatus = allowEmail ? await deliverEmail(user.email, input.title, `${input.body}\n\nTalent Crafters Recruitment`) : "not_sent";
  const whatsappStatus = allowWhatsApp && profile?.phone ? await sendWhatsApp(profile.phone, `${input.title}. ${input.body}`) : "not_sent";
  notifyUser({
    userId: input.userId,
    title: input.title,
    body: input.body,
    href: input.href,
    emailStatus,
    whatsappStatus,
  });
}
