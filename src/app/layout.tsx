import type { Metadata } from "next";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://justiceclockindia.org"),
  title: {
    default: "Justice Clock India",
    template: "%s | Justice Clock India",
  },
  description: "A mobile-first public data website for Justice Clock India.",
  applicationName: "Justice Clock India",
  keywords: ["justice", "courts", "India", "public data"],
  openGraph: {
    title: "Justice Clock India",
    description: "A mobile-first public data website for Justice Clock India.",
    siteName: "Justice Clock India",
    type: "website",
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
        <div className="mx-auto flex min-h-screen w-full max-w-screen-sm flex-col bg-[#f8f5ee]">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-[#f8f5ee]/95 px-4 py-4 backdrop-blur">
            <Link
              href="/"
              className="text-lg font-semibold tracking-normal text-slate-950"
            >
              Justice Clock India
            </Link>
          </header>

          <main className="flex-1 px-4 py-6 pb-24">{children}</main>

          <BottomNav />
        </div>
      </body>
    </html>
  );
}
