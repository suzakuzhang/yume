import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { LocaleProvider } from "@/components/LocaleProvider";
import { Chrome } from "@/components/Chrome";
import { Atmosphere } from "@/components/Atmosphere";

export const metadata: Metadata = {
  title: "yume 夢 — 入梦之阈 / the threshold of dreaming",
  description:
    "一道你跨过的阈。把今夜的意象交付，看它化作画，听弗洛伊德、荣格、周公与占卜四种目光在你的梦边低语。A threshold you cross: a bilingual, guidance-oriented dream journal.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        <Atmosphere />
        <LocaleProvider>
          <AuthProvider>
            <Chrome>{children}</Chrome>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
