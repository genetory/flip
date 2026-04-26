import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flip Ops Admin",
  description: "Operations administration console"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
