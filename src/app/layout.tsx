import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Lao } from "next/font/google"; // เพิ่ม Noto_Sans_Lao
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const notoSansLao = Noto_Sans_Lao({
  variable: "--font-noto-lao",
  subsets: ["lao"], // ระบุว่าเป็นภาษาลาว
  weight: ["400", "700"], // เลือกความหนาที่ต้องการใช้
});

// ... ส่วนของ metadata ...

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
  <html lang="lo">
    <body className={`${geistSans.variable} ${notoSansLao.variable} antialiased`}>
      {children}
    </body>
  </html>
);
}