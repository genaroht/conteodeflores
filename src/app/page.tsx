import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.rol === "ADMIN" || session.rol === "ENCARGADO_AREA") {
    redirect("/dashboard");
  }

  redirect("/combinaciones");
}