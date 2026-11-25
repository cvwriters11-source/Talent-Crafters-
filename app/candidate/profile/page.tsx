import { Dash } from "@/components/Dash";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { updateCandidateAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { COUNTRIES, QUALIFICATIONS } from "@/lib/constants";
import { getCandidate, listIndustries } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const user = await requireUser(["candidate"]);
  const query = await searchParams;
  const profile = getCandidate(user.id);
  if (!profile) return null;
  return (
    <Dash role={user.role} name={profile.full_name} userId={user.id} title="Personal profile" path="/candidate/profile">
      <Flash notice={query.notice} error={query.error} />
      <form action={updateCandidateAction} className="card" style={{ display: "grid", gap: "0.8rem" }}>
        <div className="field-row">
          <label>Name<input name="firstName" defaultValue={profile.first_name || profile.full_name.split(" ")[0]} required /></label>
          <label>Surname<input name="surname" defaultValue={profile.surname || profile.full_name.split(" ").slice(1).join(" ")} required /></label>
        </div>
        <label>Phone<input name="phone" defaultValue={profile.phone} required /></label>
        <div className="field-row">
          <label>Country<select name="country" defaultValue={profile.country}>{COUNTRIES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Current location<input name="location" defaultValue={profile.location} required /></label>
        </div>
        <div className="field-row">
          <label>Career field<select name="career" defaultValue={profile.career_field}>{listIndustries().map((item) => <option key={item.id}>{item.name}</option>)}</select></label>
          <label>Years of experience<input name="years" type="number" defaultValue={profile.years_experience} min={0} max={60} /></label>
        </div>
        <label>Highest qualification<select name="qualification" defaultValue={profile.qualification}>{QUALIFICATIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Short introduction<textarea name="bio" defaultValue={profile.bio || ""} /></label>
        <label className="check-grid"><span><input type="checkbox" name="whatsapp" value="yes" defaultChecked={profile.whatsapp_opt_in === 1} /> WhatsApp notifications when configured</span></label>
        <label className="check-grid"><span><input type="checkbox" name="emailOpt" value="yes" defaultChecked={profile.email_opt_in === 1} /> Email notifications</span></label>
        <SubmitButton>Save profile</SubmitButton>
      </form>
    </Dash>
  );
}
