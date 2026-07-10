import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { GlobalSearch } from "@/components/global-search";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VC Intelligence Platform",
  description: "Premium VC Intelligence Interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
              <GlobalSearch />
            </header>
            <main className="flex-1 overflow-y-auto bg-background p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
