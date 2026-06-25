import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import { Toaster } from "@nacc/ui";
import { TH } from "@nacc/types";
import "./globals.css";

const fontSans = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${TH.app.adminName} | ${TH.app.name}`,
  description: "ระบบจัดการคำขอที่จอดรถ สำนักงาน ป.ป.ช.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={fontSans.variable}>
      <body className="font-sans antialiased">
        {/* FullCalendar v6 injects CSS into this anchor — required for Next.js */}
        <style data-fullcalendar="" />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
