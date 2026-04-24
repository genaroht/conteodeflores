import type { Metadata } from "next";

import { Providers } from "@/components/ui/Providers";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Conteo de Flores | Agrokasa",
  description: "Sistema de conteo de flores Agrokasa"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}