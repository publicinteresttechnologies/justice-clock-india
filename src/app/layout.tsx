import type { Metadata } from "next";
import "./globals.css";

const title = "Justice Clock India — Supreme Court backlog snapshot";
const description = "A source-linked public snapshot of how backed up the Supreme Court of India is right now.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-stone-50 text-slate-950">{children}</div>
      </body>
    </html>
  );
}
