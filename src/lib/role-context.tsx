"use client";

import { createContext, useContext, useState } from "react";

type Role = "owner" | "barber";

const RoleContext = createContext<{
  role: Role;
  setRole: (r: Role) => void;
}>({ role: "owner", setRole: () => {} });

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("owner");
  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
