import type {
  User,
  Barbershop,
  Barber,
  Client,
  Appointment,
  Service,
  AutomationLog,
  AppointmentStatus,
  AutomationTrigger,
} from "@prisma/client";

// Re-exports
export type {
  User,
  Barbershop,
  Barber,
  Client,
  Appointment,
  Service,
  AutomationLog,
  AppointmentStatus,
  AutomationTrigger,
};

// ─── Extended Types ────────────────────────────────────────────────────────────

export type AppointmentWithRelations = Appointment & {
  client: Client;
  barber: Barber & { user: User };
  services: Array<{
    service: Service;
    price: number;
    durationMins: number;
  }>;
};

export type ClientWithStats = Client & {
  _count: { appointments: number };
};

export type DashboardMetrics = {
  totalRevenue: number;
  revenueGrowth: number;
  totalAppointments: number;
  appointmentsGrowth: number;
  newClients: number;
  clientsGrowth: number;
  completionRate: number;
  todayAppointments: number;
};

// ─── API Response ──────────────────────────────────────────────────────────────

export type ApiResponse<T = unknown> = {
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// ─── n8n Webhook Payload ───────────────────────────────────────────────────────

export type WebhookPayload = {
  trigger: AutomationTrigger;
  barbershopId: string;
  barbershopName: string;
  timestamp: string;
  data: Record<string, unknown>;
};

// ─── Auth ──────────────────────────────────────────────────────────────────────

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  barbershopId: string;
  barbershopSlug: string;
};
