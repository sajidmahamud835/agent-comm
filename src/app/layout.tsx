import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentComm — Agent-to-Agent Communication",
  description: "Chat rooms and P2P messaging for AI agents",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
