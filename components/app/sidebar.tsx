"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/app/theme-toggle";

export type SidebarData = {
  name: string;
  handle: string | null;
  connected: boolean;
  synced: boolean;
  activityCount: number;
  synthesized: boolean;
  acceptedCount: number;
  totalItems: number;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const LogoMark = (
  <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_2px_rgba(0,0,0,0.2)]">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 4v5h-5" />
    </svg>
  </span>
);

type NavItem = { href: string; label: string; icon: React.ReactNode; badge?: React.ReactNode };

export function Sidebar(props: SidebarData): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();

  const items: NavItem[] = [
    {
      href: "/sources",
      label: "Sources",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
          <path d="M9 17H7A5 5 0 0 1 7 7h2" />
          <path d="M15 7h2a5 5 0 0 1 0 10h-2" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
      badge: props.connected ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : undefined,
    },
    {
      href: "/activity",
      label: "Activity",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
      badge: props.synced ? (
        <span className="font-mono text-[11px] text-muted-foreground">{props.activityCount}</span>
      ) : undefined,
    },
    {
      href: "/review",
      label: "Review",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
      badge: props.synthesized ? (
        <span className="font-mono text-[11px] text-muted-foreground">
          {props.acceptedCount}/{props.totalItems}
        </span>
      ) : undefined,
    },
    {
      href: "/resume",
      label: "Resume",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="flex h-screen w-[252px] flex-none flex-col border-r border-sidebar-border bg-sidebar px-[14px] py-[18px]">
      <div className="flex items-center gap-[9px] px-2 pt-[6px] pb-[18px]">
        {LogoMark}
        <span className="font-mono text-[12.5px] text-muted-foreground">the resume thing</span>
      </div>

      <nav className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-[38px] items-center gap-2.5 rounded-[9px] border border-transparent px-2.5 text-[13.5px] font-medium text-sidebar-foreground hover:bg-sidebar-accent ${active ? "bg-sidebar-accent" : "bg-transparent"}`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.badge}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="flex items-center gap-2.5 rounded-[11px] border border-border bg-card p-2 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex size-8 flex-none items-center justify-center rounded-lg bg-primary text-[12px] font-semibold tracking-[0.02em] text-primary-foreground">
          {initials(props.name)}
        </div>
        <div className="flex min-w-0 flex-1 flex-col leading-[1.25]">
          <span className="truncate text-[13px] font-semibold text-foreground">{props.name}</span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {props.handle ? `@${props.handle}` : "connected"}
          </span>
        </div>
        <ThemeToggle className="flex size-[30px] flex-none items-center justify-center rounded-[7px] border border-transparent text-muted-foreground hover:bg-accent hover:text-foreground" />
        <button
          type="button"
          title="Sign out"
          onClick={async () => {
            await signOut();
            router.push("/");
            router.refresh();
          }}
          className="flex size-[30px] flex-none items-center justify-center rounded-[7px] border border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
