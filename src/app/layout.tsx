import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { RepositoryProvider } from "@/contexts/RepositoryContext";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hlavi Web - Task Management",
  description: "Visualize and manage your hlavi project tasks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={spaceGrotesk.variable}>
        <QueryProvider>
          <RepositoryProvider>{children}</RepositoryProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
