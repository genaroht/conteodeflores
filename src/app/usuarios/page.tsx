"use client";

import { FormEvent, useEffect, useState } from "react";
import { Save } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { useToast } from "@/components/ui/ToastProvider";

type Usuario = {
  id: string;
  usuario: string;
  nombre: string;
  rol: string;
  activo: boolean;
};

function UsuarioRow({
  item,
  onSaved
}: {
  item: Usuario;
  onSaved: () => void;
}) {
  const toast = useToast();

  const [usuario, setUsuario] = useState(item.usuario);
  const [nombre, setNombre] = useState(item.nombre);
  const [rol, setRol] = useState(item.rol === "USUARIO" ? "OPERADOR" : item.rol);
  const [activo, setActivo] = useState(item.activo);
  const [password, setPassword] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setGuardando(true);

    const response = await fetch(`/api/usuarios/${item.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        usuario,
        nombre,
        rol,
        activo,
        password: password.trim() ? password : undefined
      })
    });

    const data = await response.json();

    setGuardando(false);

    if (!response.ok) {
      toast.error(data.message || "No se pudo actualizar usuario.");
      return;
    }

    toast.success("Usuario actualizado correctamente.");
    setPassword("");
    onSaved();
  }

  return (
    <tr className="border-t border-[#DDE7E1] align-top">
      <td className="px-4 py-3">
        <input
          className="input-base"
          value={usuario}
          onChange={(event) => setUsuario(event.target.value)}
        />
        <p className="mt-1 text-xs text-slate-500">@agrokasa.com.pe</p>
      </td>

      <td className="px-4 py-3">
        <input
          className="input-base"
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
        />
      </td>

      <td className="px-4 py-3">
        <select
          className="input-base"
          value={rol}
          onChange={(event) => setRol(event.target.value)}
        >
          <option value="OPERADOR">OPERADOR</option>
          <option value="ENCARGADO_AREA">ENCARGADO DE ÁREA</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </td>

      <td className="px-4 py-3">
        <select
          className="input-base"
          value={activo ? "SI" : "NO"}
          onChange={(event) => setActivo(event.target.value === "SI")}
        >
          <option value="SI">Activo</option>
          <option value="NO">Inactivo</option>
        </select>
      </td>

      <td className="px-4 py-3">
        <input
          type="text"
          className="input-base"
          placeholder="Nueva clave"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <p className="mt-1 text-xs text-slate-500">
          La clave actual está protegida. Escribe una nueva para cambiarla.
        </p>
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="button-secondary min-h-10 px-3 py-2 text-sm"
            onClick={guardar}
            disabled={guardando}
          >
            <Save className="mr-2 h-4 w-4" />
            {guardando ? "Guardando..." : "Guardar"}
          </button>

          <button
            type="button"
            className={
              activo
                ? "inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
                : "button-secondary min-h-10 px-3 py-2 text-sm"
            }
            onClick={async () => {
              if (activo) {
                const response = await fetch(`/api/usuarios/${item.id}`, {
                  method: "DELETE"
                });

                const data = await response.json();

                if (!response.ok) {
                  toast.error(data.message || "No se pudo inactivar.");
                  return;
                }

                toast.success(data.message || "Usuario inactivado.");
                onSaved();
                return;
              }

              setActivo(true);

              const response = await fetch(`/api/usuarios/${item.id}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  usuario,
                  nombre,
                  rol,
                  activo: true,
                  password: password.trim() ? password : undefined
                })
              });

              const data = await response.json();

              if (!response.ok) {
                toast.error(data.message || "No se pudo activar.");
                return;
              }

              toast.success("Usuario activado correctamente.");
              onSaved();
            }}
          >
            {activo ? "Inactivar" : "Activar"}
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function UsuariosPage() {
  const toast = useToast();

  const [items, setItems] = useState<Usuario[]>([]);
  const [usuario, setUsuario] = useState("");
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("OPERADOR");

  async function cargar() {
    const response = await fetch("/api/usuarios", {
      cache: "no-store"
    });

    const data = await response.json();
    setItems(data.items || []);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crear(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch("/api/usuarios", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        usuario,
        nombre,
        password,
        rol,
        activo: true
      })
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.message || "No se pudo crear usuario.");
      return;
    }

    toast.success("Usuario creado correctamente.");

    setUsuario("");
    setNombre("");
    setPassword("");
    setRol("OPERADOR");
    cargar();
  }

  return (
    <AppShell title="Usuarios">
      <div className="space-y-6">
        <section className="card-base">
          <h1 className="text-2xl font-black text-[#10231A]">Usuarios</h1>
          <p className="mt-1 text-sm text-slate-500">
            Crea usuarios, cambia roles, activa o desactiva accesos y actualiza claves.
          </p>
        </section>

        <section className="card-base">
          <form className="grid gap-3 md:grid-cols-5" onSubmit={crear}>
            <input
              className="input-base"
              placeholder="Usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />

            <input
              className="input-base"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />

            <input
              className="input-base"
              placeholder="Clave"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <select
              className="input-base"
              value={rol}
              onChange={(e) => setRol(e.target.value)}
            >
              <option value="OPERADOR">OPERADOR</option>
              <option value="ENCARGADO_AREA">ENCARGADO DE ÁREA</option>
              <option value="ADMIN">ADMIN</option>
            </select>

            <button className="button-primary" type="submit">
              Crear
            </button>
          </form>
        </section>

        <section className="card-base overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-[#E8F5EE] text-[#0B7A3B]">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Cambiar clave</th>
                <th className="px-4 py-3">Acción</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <UsuarioRow key={item.id} item={item} onSaved={cargar} />
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  );
}