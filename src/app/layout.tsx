import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Make My Marriage",
  description: "Plan your wedding. Together.",
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
