import { PrismaClient, Rol } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordAdmin = await hash("admin123", 10);

  await prisma.usuario.upsert({
    where: {
      usuario: "admin"
    },
    update: {
      nombre: "Administrador",
      password: passwordAdmin,
      rol: Rol.ADMIN,
      activo: true
    },
    create: {
      usuario: "admin",
      nombre: "Administrador",
      password: passwordAdmin,
      rol: Rol.ADMIN,
      activo: true
    }
  });

  console.log("Seed completado.");
  console.log("Usuario: admin");
  console.log("Clave: admin123");
}

main()
  .catch((error) => {
    console.error("Error ejecutando seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });