export function Flash({ notice, error }: { notice?: string; error?: string }) {
  if (error) {
    const errors: Record<string, string> = {
      auth: "That email or password is not correct.",
      rate: "Too many attempts. Wait a few minutes and try again.",
      suspended: "This account is suspended.",
      invalid: "Check the highlighted fields and try again.",
      consent: "Consent is required before an account can be created.",
      exists: "An account with that email already exists.",
      cv: "Upload a PDF or Word CV of 5 MB or less.",
      size: "That CV is larger than 5 MB.",
      missing: "Upload a CV before you apply.",
      applied: "You have already applied for this vacancy.",
      jobs: "Choose exactly two open vacancies to apply for.",
      closed: "This vacancy is not open for applications.",
      password: "The current password is wrong, or the new one is too short.",
      confirm: "Type DELETE to confirm account removal.",
      forbidden: "Only the super administrator can change that account.",
      self: "You cannot change your own access from this screen.",
      applications: "This vacancy has applications, so it was kept. Archive it instead.",
      locked: "This vacancy can no longer be edited.",
      company: "A company profile is required before a vacancy can be posted.",
    };
    return <p className="alert">{errors[error] || "Something went wrong. Try again."}</p>;
  }
  if (!notice) return null;
  if (notice === "busy") return <p className="notice">A discovery run is already in progress.</p>;
  if (/^\d+-\d+-\d+$/.test(notice)) {
    const [created, duplicates, found] = notice.split("-");
    return (
      <p className="notice">
        Discovery finished. {found} listings were read, {created} new vacancies entered the approval queue, and {duplicates} duplicates were skipped.
      </p>
    );
  }
  if (/^\d+$/.test(notice)) return <p className="notice">Notifications queued for {notice} people.</p>;
  const notes: Record<string, string> = {
    saved: "Changes saved.",
    pending: "Your registration is with the administrator for approval. You can review your details while you wait.",
    sent: "Your message has been sent.",
    applied: "Your application is pending review.",
    submitted: "The vacancy was submitted for administrator approval.",
    interview: "The interview invitation was sent.",
    deleted: "Your account and stored CV have been removed.",
  };
  return <p className="notice">{notes[notice] || "Saved."}</p>;
}
