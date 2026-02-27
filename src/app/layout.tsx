import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { RepositoryProvider } from "@/contexts/RepositoryContext";

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
      <body>
        <QueryProvider>
          <RepositoryProvider>{children}</RepositoryProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
