import { Link, useLocation } from "wouter";
import { Home, Swords, Trophy, ShoppingBag, User, Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConnectWallet } from "./ConnectWallet";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/mint", label: "Mint", icon: Hexagon },
  { href: "/arena", label: "Arena", icon: Swords },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/marketplace", label: "Market", icon: ShoppingBag },
  { href: "/profile", label: "Profile", icon: User },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img
              src={`${import.meta.env.BASE_URL}brand/logo.png`}
              alt="Arena Protocol"
              className="w-7 h-7 rounded-sm object-cover"
              loading="eager"
              decoding="async"
            />
            <span className="font-bold text-sm tracking-widest font-mono text-primary hidden sm:inline">
              ARENA PROTOCOL
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded transition-colors",
                  location === href
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </nav>
          <ConnectWallet />
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>

      <footer className="hidden md:block border-t border-border/30 bg-card/40 py-4">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <span>ARENA PROTOCOL // BASE MAINNET // {new Date().getFullYear()}</span>
          <a
            href="https://basescan.org/address/0x3b855F88CB93aA642EaEB13F59987C552Fc614b5"
            target="_blank"
            rel="noreferrer"
            className="hover:text-primary"
          >
            VERIFIED CONTRACTS ↗
          </a>
        </div>
      </footer>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-md border-t border-border/50 z-50">
        <div className="grid grid-cols-6 h-16">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-mono transition-colors h-full",
                location === href ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px]">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
