import type { Metadata } from "next";
import { AppProvider } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "DiaBitter - Directional Drilling Trajectory Suite",
  description: "Engineering-grade directional drilling trajectory calculation and 3D visualization suite.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth dark">
      <body className="min-h-screen flex flex-col antialiased bg-slate-50 text-slate-900 dark:bg-[#0b0f19] dark:text-slate-100 transition-colors duration-200">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
