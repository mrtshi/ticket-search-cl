import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/sonner";

const appName = "Polair";

export const metadata: Metadata = {
  title: appName,
  description: "Поиск по заявкам и серийным номерам",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background flex flex-col">
        <ThemeProvider>
          <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-center relative">
              <Link href="/" className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://www.polair.com/local/templates/cult/img/logo.svg"
                  alt="Polair"
                  className="h-8 w-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                    if (fallback) fallback.style.display = "inline-block";
                  }}
                />
                <span
                  className="hidden font-display text-lg font-bold tracking-tight text-primary"
                  style={{ display: "none" }}
                >
                  POLAIR
                </span>
              </Link>
              <div className="absolute right-4">
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t">
            <div className="container mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} {appName}
            </div>
          </footer>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
