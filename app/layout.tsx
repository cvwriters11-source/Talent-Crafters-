import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Talent Crafters Recruitment", template: "%s · Talent Crafters" },
  description: "Connecting talent with opportunity through reviewed local and international recruitment.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
