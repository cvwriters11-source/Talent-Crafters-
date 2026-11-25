"use client";

import { useState } from "react";

type OpenJob = {
  id: string;
  title: string;
  company_name: string;
  country: string | null;
  location: string | null;
  industry: string | null;
};

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
              <br />
              {job.company_name} · {job.country || job.location || "Location in the listing"}
              {job.industry ? ` · ${job.industry}` : ""}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
