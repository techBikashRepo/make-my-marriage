import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Make My Marriage | Plan your wedding together",
  description:
    "Plan wedding events, tasks, guests, expenses, vendors, and memories with your family in one shared workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
