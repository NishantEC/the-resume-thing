"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/app/theme-toggle";

export type SidebarData = {
  name: string;
  handle: string | null;
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

type NavItem = { href: string; label: string; icon: React.ReactNode };

export function Sidebar(props: SidebarData): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();

  const items: NavItem[] = [
    {
      href: "/home",
      label: "Home",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      href: "/resume",
      label: "Résumé",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      ),
    },
    {
      href: "/settings",
      label: "Settings",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
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
            </Link>
          );
        })}
        <div className="flex h-[38px] cursor-default items-center gap-2.5 rounded-[9px] border border-transparent px-2.5 text-[13.5px] font-medium text-sidebar-foreground opacity-50">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <span className="flex-1">Projects</span>
          <span className="rounded bg-sidebar-accent px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">soon</span>
        </div>
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
