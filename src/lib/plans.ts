/**
 * Feature gating — límites por plan de suscripción.
 * Usar en API routes y Server Components para controlar acceso.
 */

export type PlanLimit = {
  maxBarbers:         number;
  whatsappPerMonth:   number;
  hasEmailNotifications: boolean;
  hasAutomations:     boolean;
  hasLoyalty:         boolean;
  hasAdvancedReports: boolean;
};

export const PLAN_LIMITS: Record<string, PlanLimit> = {
  FREE: {
    maxBarbers:            1,
    whatsappPerMonth:      0,
    hasEmailNotifications: false,
    hasAutomations:        false,
    hasLoyalty:            false,
    hasAdvancedReports:    false,
  },
  STARTER: {
    maxBarbers:            1,
    whatsappPerMonth:      0,
    hasEmailNotifications: true,
    hasAutomations:        false,
    hasLoyalty:            false,
    hasAdvancedReports:    false,
  },
  PRO: {
    maxBarbers:            7,
    whatsappPerMonth:      130,
    hasEmailNotifications: true,
    hasAutomations:        true,
    hasLoyalty:            true,
    hasAdvancedReports:    false,
  },
  ENTERPRISE: {
    maxBarbers:            10,
    whatsappPerMonth:      500,
    hasEmailNotifications: true,
    hasAutomations:        true,
    hasLoyalty:            true,
    hasAdvancedReports:    true,
  },
};

// Durante el trial se dan beneficios de PRO
export const TRIAL_LIMITS: PlanLimit = PLAN_LIMITS.PRO;

/** Devuelve los límites efectivos de una barbería considerando trial */
export function getEffectiveLimits(
  plan:   string,
  status: string,
  trialEndsAt: Date | null,
): PlanLimit {
  if (status === "TRIALING" && trialEndsAt && trialEndsAt > new Date()) {
    return TRIAL_LIMITS;
  }
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;
}

/** Verifica si el plan puede agregar más barberos */
export function canAddBarber(
  plan:          string,
  status:        string,
  trialEndsAt:   Date | null,
  currentCount:  number,
): boolean {
  const limits = getEffectiveLimits(plan, status, trialEndsAt);
  return currentCount < limits.maxBarbers;
}

/** Verifica si el plan tiene acceso a automatizaciones WhatsApp */
export function canUseWhatsApp(
  plan:        string,
  status:      string,
  trialEndsAt: Date | null,
): boolean {
  const limits = getEffectiveLimits(plan, status, trialEndsAt);
  return limits.whatsappPerMonth > 0;
}
