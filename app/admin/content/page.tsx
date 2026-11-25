import { Dash } from "@/components/Dash";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { saveContentAction, testimonialAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { content, listTestimonials } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function ContentAdmin({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const user = await requireUser(["admin", "super_admin"]);
  const query = await searchParams;
  const copy = content();
  const quotes = listTestimonials();
  const fields: [string, string, string][] = [
    ["hero_headline", "Headline", copy.heroHeadline],
    ["hero_subtext", "Supporting text", copy.heroSubtext],
    ["about_intro", "About introduction", copy.about],
    ["mission", "Mission", copy.mission],
    ["vision", "Vision", copy.vision],
    ["philosophy", "Philosophy", copy.philosophy],
    ["commitment", "Commitment", copy.commitment],
    ["contact_email", "Email", copy.email],
    ["contact_phone", "Telephone", copy.phone],
    ["contact_address", "Office address", copy.address],
    ["contact_whatsapp", "WhatsApp number", copy.whatsapp],
    ["map_query", "Map search", copy.mapQuery],
    ["social_linkedin", "LinkedIn", copy.linkedin],
    ["social_facebook", "Facebook", copy.facebook],
    ["social_instagram", "Instagram", copy.instagram],
    ["social_x", "X", copy.x],
  ];
  return (
    <Dash role={user.role} name={user.email} userId={user.id} title="Website content" path="/admin/content">
      <Flash notice={query.notice} error={query.error} />
      <form action={saveContentAction} className="card" style={{ display: "grid", gap: "0.7rem" }}>
        {fields.map(([name, label, value]) => (
          <label key={name}>{label}{name.startsWith("hero") || name.includes("intro") || ["mission", "vision", "philosophy", "commitment"].includes(name) ? <textarea name={name} defaultValue={value} /> : <input name={name} defaultValue={value} />}</label>
        ))}
        <h3>Services</h3>
        {copy.services.map((service, index) => (
          <div key={service.title} className="field-row">
            <input name={`service_title_${index}`} defaultValue={service.title} />
            <input name={`service_text_${index}`} defaultValue={service.text} />
          </div>
        ))}
        <h3>Values</h3>
        {copy.values.map((value, index) => (
          <div key={value.title} className="field-row">
            <input name={`value_title_${index}`} defaultValue={value.title} />
            <input name={`value_text_${index}`} defaultValue={value.text} />
          </div>
        ))}
        <SubmitButton>Save website content</SubmitButton>
      </form>
      <h2 style={{ margin: "1.2rem 0 0.6rem" }}>Testimonials</h2>
      <p className="muted">Replace the sample quotations with consented testimonials. Do not invent a person’s name.</p>
      {quotes.map((quote) => (
        <form key={quote.id} action={testimonialAction} className="card" style={{ display: "grid", gap: "0.5rem", marginTop: "0.6rem" }}>
          <input type="hidden" name="id" value={quote.id} />
          <div className="field-row">
            <input name="name" defaultValue={quote.name} />
            <input name="role" defaultValue={quote.role} />
          </div>
          <textarea name="quote" defaultValue={quote.quote} />
          <label className="check-grid"><span><input type="checkbox" name="active" value="yes" defaultChecked={quote.active === 1} /> Visible</span></label>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <button className="btn small" name="intent" value="save">Save</button>
            <button className="btn small ghost" name="intent" value="delete">Remove</button>
          </div>
        </form>
      ))}
      <form action={testimonialAction} className="card" style={{ display: "grid", gap: "0.5rem", marginTop: "0.6rem" }}>
        <h3>Add a testimonial</h3>
        <input name="name" placeholder="Name or role, with consent" />
        <input name="role" placeholder="Organisation or role" />
        <textarea name="quote" />
        <input type="hidden" name="active" value="yes" />
        <button className="btn" name="intent" value="save">Add testimonial</button>
      </form>
    </Dash>
  );
}
