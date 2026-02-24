import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Providers from "@/components/Providers";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "DTK Industrial Components",
  description: "NFPA and ISO cylinder accessories with technical resources and fast ordering.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Providers>
          <Header />
          {children}
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
