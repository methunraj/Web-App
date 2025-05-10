import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, SidebarHeader, SidebarFooter } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Toaster } from "@/components/ui/toaster";
import { AppLogo } from '@/components/layout/AppLogo';
import { Button } from '@/components/ui/button';
import { PanelLeft } from 'lucide-react';
import { AppProviders } from '@/contexts/AppProviders';


const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'IntelliExtract UI',
  description: 'Extract structured data from documents using LLMs',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppProviders>
          <SidebarProvider defaultOpen>
            <Sidebar variant="sidebar" collapsible="icon" className="border-r">
              <AppSidebar />
            </Sidebar>
            <SidebarInset className="flex flex-col">
              <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="md:hidden">
                      <PanelLeft />
                      <span className="sr-only">Toggle Menu</span>
                    </SidebarTrigger>
                  <AppLogo />
                </div>
              </header>
              <main className="flex-1 p-4 sm:px-6 sm:py-0">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
