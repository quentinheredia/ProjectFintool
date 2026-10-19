import Link from "next/link";

const NAV_LINKS = [
  { href: "/sandbox", label: "Sandbox" },
  { href: "/industries", label: "Industries" },
] as const;

type NavHref = (typeof NAV_LINKS)[number]["href"];

export function SiteHeader({ current }: { current?: NavHref }) {
  return (
    <header className="flex h-16 items-center justify-between">
      <Link
        href="/"
        translate="no"
        className="rounded-md text-lg font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-brand"
      >
        Parity<span className="text-brand">.</span>
      </Link>
      <nav aria-label="Main" className="flex items-center gap-1">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            aria-current={href === current ? "page" : undefined}
            className="rounded-full px-3.5 py-2 text-sm text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-brand aria-[current=page]:bg-ink/[0.08] aria-[current=page]:text-ink"
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
