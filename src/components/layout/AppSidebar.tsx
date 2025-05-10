
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { AppLogo } from './AppLogo';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  FileJson2,
  MessageSquareText,
  FolderOpen,
  Cog,
  PlayCircle,
  LogOut,
  BotMessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/schema-definition', icon: FileJson2, label: 'Schema Definition' },
  { href: '/prompt-configuration', icon: MessageSquareText, label: 'Prompt Configuration' },
  { href: '/file-management', icon: FolderOpen, label: 'File Management' },
  { href: '/llm-configuration', icon: Cog, label: 'LLM Configuration' },
  { href: '/run-extraction', icon: PlayCircle, label: 'Run Extraction' },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader className="hidden md:flex border-b h-14 items-center justify-start px-3">
         <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-sidebar-foreground">
            <BotMessageSquare className="h-7 w-7 text-accent" />
            <span className="group-data-[collapsible=icon]:hidden">IntelliExtract</span>
         </Link>
      </SidebarHeader>
      <SidebarContent className="flex-1 overflow-y-auto p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  asChild
                  variant="default"
                  className={cn(
                    'justify-start w-full',
                    pathname === item.href ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                  tooltip={{children: item.label, className: "bg-card text-card-foreground border-border"}}
                >
                  <a>
                    <item.icon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t">
        {/* Placeholder for potential footer content like settings or logout */}
      </SidebarFooter>
    </>
  );
}
