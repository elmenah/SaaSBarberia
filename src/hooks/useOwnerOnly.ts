"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

/**
 * Redirige al barbero a su agenda si intenta acceder a una página exclusiva del dueño.
 * Usar al inicio de cualquier page component restringido.
 */
export function useOwnerOnly() {
  const { isBarber, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isBarber) {
      router.replace("/dashboard/agenda");
    }
  }, [isBarber, loading, router]);

  return { isBarber, loading };
}
