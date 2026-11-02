import type { Metadata } from "next";
import "./globals.css";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const metadata: Metadata = { metadataBase: new URL(siteUrl), title: { default: "Salah Links | اختصر روابطك بذكاء", template: "%s | Salah Links" }, description: "منصة عربية سهلة لاختصار الروابط وإدارتها وقياس عدد النقرات.", robots: { index: true, follow: true } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ar" dir="rtl"><body>{children}</body></html>; }
