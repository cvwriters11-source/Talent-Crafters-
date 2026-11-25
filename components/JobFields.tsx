import { COUNTRIES, EMPLOYMENT_TYPES, EXPERIENCE_LEVELS } from "@/lib/constants";
import type { JobRow } from "@/lib/repo";

export function JobFields({
  job,
  industries,
  categories,
}: {
  job?: Partial<JobRow> | null;
  industries: { name: string }[];
  categories: { name: string }[];
}) {
  return (
    <div className="grid-2" style={{ alignItems: "start" }}>
      <div style={{ display: "grid", gap: "0.8rem" }}>
        <label>Job title<input name="title" required defaultValue={job?.title || ""} /></label>
        <label>Description<textarea name="description" required defaultValue={job?.description || ""} /></label>
        <label>Requirements<textarea name="requirements" defaultValue={job?.requirements || ""} /></label>
        <label>Qualifications<textarea name="qualifications" defaultValue={job?.qualifications || ""} /></label>
      </div>
      <div style={{ display: "grid", gap: "0.8rem" }}>
        <label>Experience requested<input name="experience" defaultValue={job?.experience || ""} /></label>
        <div className="field-row">
          <label>Country
            <select name="country" defaultValue={job?.country || ""}>
              <option value="">Select</option>
              {COUNTRIES.map((country) => <option key={country}>{country}</option>)}
            </select>
          </label>
          <label>City<input name="city" defaultValue={job?.city || ""} /></label>
        </div>
        <label>Location label<input name="location" defaultValue={job?.location || ""} /></label>
        <div className="field-row">
          <label>Employment type
            <select name="employment" defaultValue={job?.employment_type || ""}>
              <option value="">Select</option>
              {EMPLOYMENT_TYPES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>Experience level
            <select name="level" defaultValue={job?.experience_level || ""}>
              <option value="">Select</option>
              {EXPERIENCE_LEVELS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
        <div className="field-row">
          <label>Industry
            <select name="industry" defaultValue={job?.industry || ""}>
              <option value="">Select</option>
              {industries.map((item) => <option key={item.name}>{item.name}</option>)}
            </select>
          </label>
          <label>Category
            <select name="category" defaultValue={job?.category || ""}>
              <option value="">Select</option>
              {categories.map((item) => <option key={item.name}>{item.name}</option>)}
            </select>
          </label>
        </div>
        <label>Salary as advertised<input name="salaryText" defaultValue={job?.salary_text || ""} placeholder="Leave blank if it was not advertised" /></label>
        <div className="field-row">
          <label>Salary minimum<input name="salaryMin" type="number" min="0" defaultValue={job?.salary_min || ""} /></label>
          <label>Salary maximum<input name="salaryMax" type="number" min="0" defaultValue={job?.salary_max || ""} /></label>
        </div>
        <div className="field-row">
          <label>Currency<input name="currency" defaultValue={job?.currency || ""} /></label>
          <label>Closing date<input name="deadline" type="date" defaultValue={job?.deadline || ""} /></label>
        </div>
        <label>Reference<input name="reference" defaultValue={job?.reference_code || ""} /></label>
      </div>
    </div>
  );
}
