"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileSpreadsheet,
  Flower2,
  KeyRound,
  LayoutDashboard,
  Settings2,
  Users
} from "lucide-react";

import type { AppSession } from "@/lib/session";

type SidebarLink = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: string[];
};

type SidebarProps = {
  session: AppSession;
};

const links: SidebarLink[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "ENCARGADO_AREA"]
  },
  {
    href: "/combinaciones",
    label: "Combinaciones",
    icon: Flower2,
    roles: ["ADMIN", "ENCARGADO_AREA", "OPERADOR", "USUARIO"]
  },
  {
    href: "/maestros",
    label: "Crear detalles",
    icon: Settings2,
    roles: ["ADMIN", "ENCARGADO_AREA"]
  },
  {
    href: "/reportes",
    label: "Reportes",
    icon: BarChart3,
    roles: ["ADMIN", "ENCARGADO_AREA"]
  },
  {
    href: "/excel",
    label: "Excel",
    icon: FileSpreadsheet,
    roles: ["ADMIN", "ENCARGADO_AREA"]
  },
  {
    href: "/usuarios",
    label: "Usuarios",
    icon: Users,
    roles: ["ADMIN"]
  },
  {
    href: "/perfil",
    label: "Mi clave",
    icon: KeyRound,
    roles: ["ADMIN", "ENCARGADO_AREA", "OPERADOR", "USUARIO"]
  }
];

function nombreRol(rol: string) {
  if (rol === "ADMIN") return "ADMIN";
  if (rol === "ENCARGADO_AREA") return "ENCARGADO";
  if (rol === "OPERADOR") return "OPERADOR";
  return "USUARIO";
}

function rutaInicial(rol: string) {
  if (rol === "ADMIN" || rol === "ENCARGADO_AREA") {
    return "/dashboard";
  }

  return "/combinaciones";
}

export function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname();
  const rolActual = String(session.rol);

  const linksVisibles = links.filter((link) => link.roles.includes(rolActual));

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-72 border-r border-[#DDE7E1] bg-white px-5 py-6 lg:flex lg:flex-col">
      <Link href={rutaInicial(rolActual)} className="mb-6 flex items-center gap-3">
        <Image
          src="/logo-agrokasa.png"
          alt="Agrokasa"
          width={210}
          height={80}
          priority
          className="h-auto w-52"
        />
      </Link>

      <div className="mb-8 rounded-2xl bg-[#E8F5EE] px-4 py-3">
        <p className="text-sm font-black text-[#0B7A3B]">
          Conteo de Flores
        </p>
      </div>

      <nav className="flex-1 space-y-2">
        {linksVisibles.map((link) => {
          const Icon = link.icon;
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                active
                  ? "flex items-center gap-3 rounded-2xl bg-[#E8F5EE] px-4 py-3 text-sm font-black text-[#0B7A3B]"
                  : "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-[#10231A] hover:bg-[#E8F5EE] hover:text-[#0B7A3B]"
              }
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-2xl border border-[#DDE7E1] bg-[#F5F7F6] p-4">
        <p className="text-sm font-black text-[#10231A]">
          {session.nombre}
        </p>

        <p className="mt-1 break-all text-xs font-semibold text-slate-500">
          {session.usuario}@agrokasa.com.pe
        </p>

        <span className="mt-3 inline-flex rounded-full bg-[#E8F5EE] px-3 py-1 text-xs font-black text-[#0B7A3B]">
          {nombreRol(rolActual)}
        </span>
      </div>
    </aside>
  );
}