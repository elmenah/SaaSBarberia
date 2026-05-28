"use client";

import { useEffect }   from "react";
import { useRouter }   from "next/navigation";
import { useAuth }     from "@/context/auth-context";
import { RoleProvider } from "@/lib/role-context";
import { Sidebar }          from "./Sidebar";
import { TopBar }           from "./TopBar";
import { BottomNav }        from "./BottomNav";
import { TrialExpiredGate } from "./TrialExpiredGate";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, barbershop, loading } = useAuth();
  const router = useRouter();

  // Si el usuario está autenticado pero no tiene barbería en DB → onboarding
  useEffect(() => {
    if (!loading && user && !barbershop) {
      router.replace("/setup");
    }
  }, [loading, user, barbershop, router]);

  // Mientras detectamos el estado, mostrar pantalla de carga mínima
  if (loading || (user && !barbershop)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--ds-shell)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "rgba(202,138,4,0.4)", borderTopColor: "transparent" }}
          />
          <p className="text-xs" style={{ color: "#3F3F46" }}>Cargando panel...</p>
        </div>
      </div>
    );
  }

  return (
    <RoleProvider>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--ds-shell)" }}>
        {/* Sidebar — solo visible en md+ */}
        <Sidebar />

        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar />
          <main
            className="flex-1 overflow-y-auto p-4 md:p-6"
            style={{ backgroundColor: "var(--ds-page)" }}
          >
            <TrialExpiredGate>
              {children}
            </TrialExpiredGate>
          </main>

          {/* Bottom nav — solo visible en mobile */}
          <BottomNav />
        </div>
      </div>
    </RoleProvider>
  );
}
