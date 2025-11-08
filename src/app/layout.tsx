import type { Metadata } from "next";
import { Geist, Geist_Mono, Pacifico } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Navbar } from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pacifico = Pacifico({
  variable: "--font-pacifico",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "YESCA Team – Youth Evangelical Soldiers of Christian Assemblies",
  description:
    "YESCA Team (Youth Evangelical Soldiers of Christian Assemblies) – empowering youth in faith and purity since 1994. Join us for Youth Camp 2025 (YC25) and experience 30 years of God’s faithfulness.",
  keywords: [
    "YESCA Team",
    "Youth Evangelical Soldiers",
    "Christian Assemblies",
    "Youth Camp 2025",
    "YC25",
    "Christian Youth Ministry India",
    "Bible Youth Camp",
    "Youth Retreat",
  ],
  authors: [{ name: "YESCA Team" }],
  openGraph: {
    title: "YESCA Team – Youth Evangelical Soldiers of Christian Assemblies",
    description:
      "YESCA Team has been serving Christian youth since 1994 through camps, retreats, and discipleship. Discover Youth Camp 2025 (YC25) celebrating 30 years of ministry.",
    url: "https://www.yescateam.com",
    siteName: "YESCA Team",
    images: [
      {
        url: "https://www.yescateam.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "YESCA Youth Camp 2025 – 30 Years of Ministry",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YESCA Team – Youth Evangelical Soldiers of Christian Assemblies",
    description:
      "YESCA Team has empowered youth for Christ since 1994. Join us for Youth Camp 2025 (YC25) celebrating 30 years of ministry.",
    images: ["https://www.yescateam.com/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.yescateam.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>

      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} font-[DIN_Pro,Arial,sans-serif] antialiased`}
      >
        <ThemeProvider 
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Navbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
