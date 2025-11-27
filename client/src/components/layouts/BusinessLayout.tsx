import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Calendar,
  CalendarDays,
  FileEdit,
  History,
  Home,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BusinessLayoutProps {
  children: ReactNode;
  title?: string;
  backLink?: string;
  backLinkText?: string;
}

const eventNavItems = [
  { id: 'dashboard', label: 'Event Dashboard', icon: Home, href: '/business/events/dashboard' },
  { id: 'create', label: 'Create Event', icon: Calendar, href: '/business/events/create' },
  { id: 'drafts', label: 'Draft Events', icon: FileEdit, href: '/business/events/drafts' },
  { id: 'past', label: 'Past Events', icon: History, href: '/business/events/past' },
];

export function BusinessLayout({ children, title, backLink, backLinkText }: BusinessLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-gradient-to-b from-slate-50 to-white">
        <div className="p-4 border-b">
          {backLink ? (
            <Link href={backLink}>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <ChevronLeft className="h-4 w-4 mr-2" />
                {backLinkText || 'Back'}
              </Button>
            </Link>
          ) : (
            <Link href="/business/dashboard">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Business Dashboard
              </Button>
            </Link>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Events Management
            </p>
            {eventNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || location.startsWith(item.href + '/');
              
              return (
                <Link key={item.id} href={item.href}>
                  <button
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md'
                        : 'hover:bg-violet-50 hover:text-violet-700 text-muted-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
