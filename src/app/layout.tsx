import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { EnhancedThemeProvider } from "@/components/theme/enhanced-theme-provider"
import { SessionProvider } from "next-auth/react"
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "ContributorConnect AI",
  description: "Discover open-source projects with AI assistance",
}
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <EnhancedThemeProvider defaultPalette="sunset">
            {children}
          </EnhancedThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
