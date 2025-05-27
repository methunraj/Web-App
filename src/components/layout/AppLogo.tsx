import { BotMessageSquare } from 'lucide-react';
import Link from 'next/link';

export function AppLogo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-primary">
      <BotMessageSquare className="h-7 w-7 text-accent" />
      <span>IntelliExtract</span>
    </Link>
  );
}
