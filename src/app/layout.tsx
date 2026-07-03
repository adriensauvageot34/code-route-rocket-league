import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Code de la route Rocket League",
  description: "Application d'entrainement tactique Rocket League."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
