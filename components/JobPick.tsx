"use client";

import { useState } from "react";

type OpenJob = {
  id: string;
  title: string;
  company_name: string;
  country: string | null;
  city: string | null;
  location: string | null;
  industry: string | null;
  category: string | null;
  employment_type: string | null;
  experience_level: string | null;
  salary_text: string | null;
};

function details(job: OpenJob) {
  return [
    ["Company", job.company_name],
    ["Country", job.country],
    ["City", job.city || job.location],
    ["Field", job.industry],
    ["Category", job.category],
    ["Employment", job.employment_type],
    ["Level", job.experience_level],
    ["Salary", job.salary_text],
  ].filter((item): item is [string, string] => Boolean(item[1]));
}

export function JobPick({ jobs }: { jobs: OpenJob[] }) {
  const [picked, setPicked] = useState<string[]>([]);
  return (
    <fieldset className="job-picks">
      <legend>Choose exactly two jobs to apply for</legend>
      <p className="muted">{picked.length} of 2 selected</p>
      {jobs.map((job) => {
        const checked = picked.includes(job.id);
        return (
          <label key={job.id}>
            <input
              type="checkbox"
              name="jobs"
              value={job.id}
              checked={checked}
              onChange={(event) => {
                const on = event.target.checked;
                setPicked((current) => {
                  if (on) return current.includes(job.id) || current.length >= 2 ? current : [...current, job.id];
                  return current.filter((id) => id !== job.id);
                });
              }}
            />
            <span>
              <strong>{job.title}</strong>
              <span className="pick-fields">
                {details(job).map(([label, value]) => (
                  <span key={label}><em>{label}</em> {value}</span>
                ))}
              </span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
