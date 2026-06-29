import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HR Daily AI",
  description: "AI-assisted recruiting operations system"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
