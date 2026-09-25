import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeRoot } from "@/components/theme-picker";
import { PlatformRouter } from "@/components/platform/platform-router";
import "./globals.css";
import "@/styles/platform-v3.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kova · From intent to production",
  description:
    "Build agentic applications and production software from one shared workspace.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <ThemeRoot>
          <PlatformRouter>{children}</PlatformRouter>
        </ThemeRoot>
      </body>
    </html>
  );
}
