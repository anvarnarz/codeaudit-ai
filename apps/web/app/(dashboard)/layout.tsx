import Link from "next/link";
import { redirect } from "next/navigation";

// This will be replaced with actual auth check in Plan 01-02
async function getSession() {
  return null; // Placeholder until Auth.js is implemented
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/audits", label: "Audits", icon: "◎" },
  { href: "/repos", label: "Repos", icon: "⎇" },
  { href: "/settings", label: "Settings", icon: "⊙" },
] as const;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col border-r bg-sidebar-background border-sidebar-border">
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
          <div className="w-6 h-6 rounded bg-white/10 border border-white/20 flex items-center justify-center">
            <span className="text-xs font-bold text-white">CA</span>
          </div>
          <span className="text-sm font-medium text-sidebar-foreground">
            CodeAudit
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <span className="text-base leading-none opacity-60" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Bottom user area placeholder */}
        <div className="px-4 py-4 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground truncate">
            {/* User email will go here in 01-02 */}
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
}
