import type { AppSession } from "@/lib/session";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";

type AppShellProps = {
  session: AppSession;
  title: string;
  children: React.ReactNode;
};

export function AppShell({ session, title, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-fondo">
      <Sidebar session={session} />

      <div className="min-h-screen lg:pl-72">
        <Header session={session} title={title} />

        <main className="page-container mobile-safe-bottom">{children}</main>
      </div>

      <MobileNav rol={session.rol} />
    </div>
  );
}