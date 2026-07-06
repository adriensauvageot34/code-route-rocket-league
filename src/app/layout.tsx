import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./question.css";
import "./landscape.css";
import "./orientation.css";
import "./fullscreen-capture.css";
import "./game-session.css";
import "./correction-panel.css";
import "./training-summary.css";

export const metadata: Metadata = {
  applicationName: "Code RL",
  title: "Code de la route Rocket League",
  description: "Application d'entrainement tactique Rocket League.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Code RL"
  },
  other: {
    "mobile-web-app-capable": "yes"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#060a0e"
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
