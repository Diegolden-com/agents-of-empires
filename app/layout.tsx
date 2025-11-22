import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mini Age of Empires",
  description: "Micro Age of Empires-inspired skirmish with two civilizations."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
