"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useToast } from "@/components/ui/ToastProvider";

const LIMITE_INACTIVIDAD_MS = 10 * 60 * 1000;
const TOUCH_MIN_INTERVAL_MS = 30 * 1000;

export function SessionTimeout() {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTouchRef = useRef(0);

  useEffect(() => {
    if (pathname === "/login") {
      return;
    }

    async function logoutPorInactividad() {
      await fetch("/api/logout", {
        method: "POST"
      });

      toast.info("Tu sesión se cerró por inactividad.");
      router.push("/login");
      router.refresh();
    }

    async function touchSession() {
      const ahora = Date.now();

      if (ahora - lastTouchRef.current < TOUCH_MIN_INTERVAL_MS) {
        return;
      }

      lastTouchRef.current = ahora;

      await fetch("/api/session/touch", {
        method: "POST"
      });
    }

    function reiniciarTimer() {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      touchSession();

      timerRef.current = setTimeout(() => {
        logoutPorInactividad();
      }, LIMITE_INACTIVIDAD_MS);
    }

    const eventos = ["mousemove", "keydown", "click", "touchstart", "scroll"];

    eventos.forEach((evento) => {
      window.addEventListener(evento, reiniciarTimer, {
        passive: true
      });
    });

    reiniciarTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      eventos.forEach((evento) => {
        window.removeEventListener(evento, reiniciarTimer);
      });
    };
  }, [pathname, router, toast]);

  return null;
}