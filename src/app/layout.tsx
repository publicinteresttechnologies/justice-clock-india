import type { Metadata } from "next";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Justice Clock India",
  description: "Supreme Court time to justice tracker.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-stone-50 text-slate-950">
          <main className="mx-auto min-h-screen w-full max-w-3xl px-4 pb-24 pt-5">
            {children}
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
