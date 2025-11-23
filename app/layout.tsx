import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Catán - LLM Agent Battle",
  description: "Settlers of Catan where AI agents compete against each other",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const privyAppId = process.env.PRIVY_API_KEY_APP_ID || "";

  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers appId={privyAppId}>
          {children}
        </Providers>
      </body>
    </html>
  );
}

