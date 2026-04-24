import Link from "next/link";
import {
  BarChart3,
  Flower2,
  LayoutDashboard,
  Settings2
} from "lucide-react";

type RolSistema = "ADMIN" | "ENCARGADO_AREA" | "OPERADOR" | "USUARIO";

type MobileLink = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: RolSistema[];
};

const links: MobileLink[] = [
  {
    href: "/dashboard",
    label: "Inicio",
    icon: LayoutDashboard,
    roles: ["ADMIN", "ENCARGADO_AREA", "OPERADOR", "USUARIO"]
  },
  {
    href: "/combinaciones",
    label: "Registro",
    icon: Flower2,
    roles: ["ADMIN", "ENCARGADO_AREA", "OPERADOR", "USUARIO"]
  },
  {
    href: "/maestros",
    label: "Detalles",
    icon: Settings2,
    roles: ["ADMIN", "ENCARGADO_AREA"]
  },
  {
    href: "/reportes",
    label: "Reportes",
    icon: BarChart3,
    roles: ["ADMIN", "ENCARGADO_AREA"]
  }
];

type MobileNavProps = {
  rol?: RolSistema | string;
};

export function MobileNav({ rol = "OPERADOR" }: MobileNavProps) {
  const rolActual = String(rol) as RolSistema;

  const visibles = links
    .filter((link) => link.roles.includes(rolActual))
    .slice(0, 4);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#DDE7E1] bg-white px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-lg lg:hidden">
      <div className="grid grid-cols-4 gap-1">
        {visibles.map((link) => {
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-[#E8F5EE] hover:text-[#0B7A3B]"
            >
              <Icon className="mb-1 h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
